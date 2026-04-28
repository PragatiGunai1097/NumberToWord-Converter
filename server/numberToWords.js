// Convert a whole number (string or number) to words.
// Uses BigInt so very large numbers stay accurate.

const ones  = ['', 'One', 'Two', 'Three', 'Four', 'Five',
               'Six', 'Seven', 'Eight', 'Nine'];
const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen',
               'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
const tens  = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty',
               'Sixty', 'Seventy', 'Eighty', 'Ninety'];

// const scales = ['', 'Thousand', 'Million', 'Billion',
//                 'Trillion', 'Quadrillion', 'Quintillion'];

const scales = ['', 'Thousand', 'Million', 'Billion',
                'Trillion', 'Quadrillion', 'Quintillion',
                'Sextillion', 'Septillion', 'Octillion',
                'Nonillion', 'Decillion'];               

// Words for any number 0..999.
function under1000(n) {
    let out = '';
    if (n >= 100) {
        out = ones[Math.floor(n / 100)] + ' Hundred';
        n %= 100;
    }
    if (n >= 20) {
        out += (out ? ' ' : '') + tens[Math.floor(n / 10)];
        if (n % 10) out += ' ' + ones[n % 10];
    } else if (n >= 10) {
        out += (out ? ' ' : '') + teens[n - 10];
    } else if (n > 0) {
        out += (out ? ' ' : '') + ones[n];
    }
    return out;
}

function numberToWords(input) {
    let s = String(input).trim();
    const negative = s.startsWith('-');
    if (negative) s = s.slice(1);

    let n = BigInt(s);
    if (n === 0n) return 'Zero';

    const parts = [];
    let i = 0;
    while (n > 0n) {
        const chunk = Number(n % 1000n);
        if (chunk) {
            const words = under1000(chunk) + (scales[i] ? ' ' + scales[i] : '');
            parts.unshift(words);
        }
        n /= 1000n;
        i++;
       // if (i >= scales.length) throw new RangeError('Number too large');
        if (n > 0n && i >= scales.length) throw new RangeError('Number too large');
    }
    return (negative ? 'Negative ' : '') + parts.join(' ');
}

module.exports = { numberToWords };
