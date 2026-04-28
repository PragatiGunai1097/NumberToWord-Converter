// Simple test runner — no dependencies, just `node tests/run-tests.js`.
// Tests the number-to-words conversion + the live HTTP API.

const assert = require('assert');
const http = require('http');
const { numberToWords } = require('../server/numberToWords');

let passed = 0, failed = 0;

function test(name, fn) {
    return Promise.resolve()
        .then(fn)
        .then(() => { console.log('  PASS  ' + name); passed++; })
        .catch(err => {
            console.log('  FAIL  ' + name);
            console.log('        ' + err.message);
            failed++;
        });
}

function section(title) {
    console.log('\n' + title);
}

// ---------------------------------------------------------------
// 1) numberToWords — pure function tests
// ---------------------------------------------------------------
async function unitTests() {
    section('numberToWords — small numbers');
    await test('0 -> "Zero"',           () => assert.strictEqual(numberToWords('0'), 'Zero'));
    await test('1 -> "One"',            () => assert.strictEqual(numberToWords('1'), 'One'));
    await test('11 -> "Eleven"',        () => assert.strictEqual(numberToWords('11'), 'Eleven'));
    await test('16 -> "Sixteen"',       () => assert.strictEqual(numberToWords('16'), 'Sixteen'));
    await test('20 -> "Twenty"',        () => assert.strictEqual(numberToWords('20'), 'Twenty'));
    await test('42 -> "Forty Two"',     () => assert.strictEqual(numberToWords('42'), 'Forty Two'));
    await test('100 -> "One Hundred"',  () => assert.strictEqual(numberToWords('100'), 'One Hundred'));
    await test('342 -> "Three Hundred Forty Two"',
        () => assert.strictEqual(numberToWords('342'), 'Three Hundred Forty Two'));

    section('numberToWords — bigger numbers');
    await test('1000 -> "One Thousand"',
        () => assert.strictEqual(numberToWords('1000'), 'One Thousand'));
    await test('8999 -> "Eight Thousand Nine Hundred Ninety Nine"',
        () => assert.strictEqual(numberToWords('8999'),
            'Eight Thousand Nine Hundred Ninety Nine'));
    await test('9001 -> "Nine Thousand One"',
        () => assert.strictEqual(numberToWords('9001'), 'Nine Thousand One'));
    await test('9000022324 -> "Nine Billion Twenty Two Thousand Three Hundred Twenty Four"',
        () => assert.strictEqual(numberToWords('9000022324'),
            'Nine Billion Twenty Two Thousand Three Hundred Twenty Four'));

    section('numberToWords — negative numbers');
    await test('-1 -> "Negative One"',
        () => assert.strictEqual(numberToWords('-1'), 'Negative One'));
    await test('-42 -> "Negative Forty Two"',
        () => assert.strictEqual(numberToWords('-42'), 'Negative Forty Two'));
    await test('-9001 -> "Negative Nine Thousand One"',
        () => assert.strictEqual(numberToWords('-9001'), 'Negative Nine Thousand One'));

    section('numberToWords — very large numbers');
    await test('1 quintillion words contain "Quintillion"', () => {
        const w = numberToWords('1000000000000000000');
        assert.ok(w.includes('Quintillion'), 'got: ' + w);
    });
    await test('25-digit number works', () => {
        const w = numberToWords('2123121232123456789045678');
        assert.ok(w.startsWith('Two Septillion'), 'got: ' + w);
    });
}

// ---------------------------------------------------------------
// 2) HTTP API tests — needs the server running on PORT (default 3000)
// ---------------------------------------------------------------
const PORT = process.env.PORT || 3000;
const HOST = '127.0.0.1';

function postJson(path, body) {
    return new Promise((resolve, reject) => {
        const data = JSON.stringify(body);
        const req = http.request({
            hostname: HOST, port: PORT, path, method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(data),
            },
        }, res => {
            let chunks = '';
            res.on('data', c => chunks += c);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(chunks) }); }
                catch (e) { reject(e); }
            });
        });
        req.on('error', reject);
        req.write(data);
        req.end();
    });
}

async function apiTests() {
    section('HTTP API (server must be running on port ' + PORT + ')');

    // Quick reachability check
    try {
        await postJson('/api/submit', { input: '1' });
    } catch {
        console.log('  SKIP  server not reachable on http://' + HOST + ':' + PORT);
        console.log('        start it with `npm start` in another terminal, then re-run.');
        return;
    }

    await test('submit valid input returns ok', async () => {
        const { status, body } = await postJson('/api/submit', { input: '1, 2, 11' });
        assert.strictEqual(status, 200);
        assert.strictEqual(body.ok, true);
        assert.strictEqual(body.count, 3);
        assert.strictEqual(body.results[2].words, 'Eleven');
    });

    await test('submit empty input returns ok:false', async () => {
        const { body } = await postJson('/api/submit', { input: '' });
        assert.strictEqual(body.ok, false);
        assert.ok(body.error);
    });

    await test('submit invalid token returns ok:false', async () => {
        const { body } = await postJson('/api/submit', { input: '1, foo, 3' });
        assert.strictEqual(body.ok, false);
        assert.ok(body.error.includes('foo'));
        assert.ok(body.example);
    });

    await test('submit trailing comma returns ok:false', async () => {
        const { body } = await postJson('/api/submit', { input: '1, 2,' });
        assert.strictEqual(body.ok, false);
    });

    await test('submit flags numbers > 9000 as isOver9000', async () => {
        const { body } = await postJson('/api/submit', { input: '8999, 9001, -9001' });
        assert.strictEqual(body.results[0].isOver9000, false);
        assert.strictEqual(body.results[1].isOver9000, true);
        assert.strictEqual(body.results[2].isOver9000, true,
            'negative numbers above 9000 in size should also be flagged');
    });

    await test('submit handles very large numbers', async () => {
        const { body } = await postJson('/api/submit',
            { input: '9000022324, 2123121232123456789045678' });
        assert.strictEqual(body.ok, true);
        assert.ok(body.results[0].words.startsWith('Nine Billion'));
        assert.ok(body.results[1].words.startsWith('Two Septillion'));
    });

    await test('sort returns items sorted alphabetically by words', async () => {
        const { body } = await postJson('/api/sort', { input: '1, 2, 3, 11' });
        const order = body.results.map(r => r.words);
        // "Eleven" < "One" < "Three" < "Two" alphabetically
        assert.deepStrictEqual(order, ['Eleven', 'One', 'Three', 'Two']);
    });

    await test('sort places "Negative" by alphabet, not by sign', async () => {
        const { body } = await postJson('/api/sort', { input: '5, -1' });
        // "Five" comes before "Negative One"
        assert.strictEqual(body.results[0].words, 'Five');
        assert.strictEqual(body.results[1].words, 'Negative One');
    });
}

// ---------------------------------------------------------------
(async () => {
    await unitTests();
    await apiTests();

    console.log('\n----------------------------------------');
    console.log(`  ${passed} passed, ${failed} failed`);
    console.log('----------------------------------------');
    process.exit(failed === 0 ? 0 : 1);
})();
