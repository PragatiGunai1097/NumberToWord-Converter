// Tiny zero-dependency Node server.
// Serves the static page and answers two API endpoints.

const http = require('http');
const fs = require('fs');
const path = require('path');
const { numberToWords } = require('./numberToWords');

const PORT = process.env.PORT || 3000;
const PUBLIC = path.join(__dirname, '..', 'public');

const MIME = {
    '.html': 'text/html; charset=utf-8',
    '.css':  'text/css; charset=utf-8',
    '.js':   'application/javascript; charset=utf-8',
    '.svg':  'image/svg+xml',
    '.ico':  'image/x-icon',
};

// --- validation ---
function parseInput(text) {
    if (typeof text !== 'string' || !text.trim()) {
        return { ok: false, error: 'Please enter at least one number.' };
    }
    const tokens = text.split(',').map(t => t.trim());
    for (const t of tokens) {
        if (t === '') return { ok: false, error: 'Empty value — check for stray commas.' };
        if (!/^-?\d+$/.test(t)) return { ok: false, error: `"${t}" is not a valid whole number.` };
    }
    return { ok: true, numbers: tokens };
}

function buildItems(numbers) {
    return numbers.map(n => ({
        number: n,
        words: numberToWords(n),
      
        isOver9000: (BigInt(n) > 9000n) || (BigInt(n) < -9000n),
    }));
}

// --- helpers ---
function readBody(req) {
    return new Promise(resolve => {
        let data = '';
        req.on('data', c => data += c);
        req.on('end', () => {
            try { resolve(JSON.parse(data || '{}')); } catch { resolve({}); }
        });
    });
}

function sendJson(res, body) {
    res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' });
    res.end(JSON.stringify(body));
}

// --- server ---
const server = http.createServer(async (req, res) => {
    // API endpoints
    if (req.method === 'POST' && (req.url === '/api/submit' || req.url === '/api/sort'))
         {
        const body = await readBody(req);
        const parsed = parseInput(body.input);
        if (!parsed.ok) {
            return sendJson(res, {
                ok: false,
                error: parsed.error,
                example: '1, 2, 3, 11, 8999, 16',
                hint: 'Enter whole numbers separated by commas. Negative numbers are allowed (e.g. -5).',
            });
        }
        const items = buildItems(parsed.numbers);
        if (req.url === '/api/sort') {
            items.sort((a, b) => a.words.localeCompare(b.words, 'en', { sensitivity: 'base' }));
        }
        return sendJson(res, { ok: true, count: items.length, results: items });
    }

    if (req.method === 'GET' && req.url === '/api/health') 
        {
        return sendJson(res, { ok: true, service: 'number-to-words' });
    }

    // Static files
    if (req.method === 'GET') {
        let url = req.url.split('?')[0];
        if (url === '/') url = '/index.html';
        const file = path.normalize(path.join(PUBLIC, url));
        if (!file.startsWith(PUBLIC)) {
            res.writeHead(403); return res.end('Forbidden');
        }
        return fs.readFile(file, (err, data) => {
            if (err) { res.writeHead(404); return res.end('Not found'); }
            res.writeHead(200, { 'Content-Type': MIME[path.extname(file)] || 'text/plain' });
            res.end(data);
        });
    }

    res.writeHead(405); res.end('Method not allowed');
});

server.listen(PORT, () => {
    console.log(`Number to Words server running at http://localhost:${PORT}`);
});
