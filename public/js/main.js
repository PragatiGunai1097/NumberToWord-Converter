// Frontend logic: handle the buttons, talk to the server, paint the list.

const $ = id => document.getElementById(id);

const form         = $('numberForm');
const input        = $('numberInput');
const submitBtn    = $('submitButton');
const sortBtn      = $('sortButton');
const clearBtn     = $('clearButton');
const exampleBtn   = $('exampleButton');
const errorBox     = $('errorContainer');
const resultsBox   = $('resultsSection');
const resultsList  = $('resultContainer');
const resultsCount = $('resultsCount');
const resultsTitle = $('resultsTitle');
const tooltip      = $('tooltip');
const tooltipText  = $('tooltipText');

// Remembers the last successfully-validated input so Sort knows what to sort.
let lastSubmitted = null;

const OVER_9000_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 56 56" aria-hidden="true">
  <defs>
    <radialGradient id="og" cx="30%" cy="30%" r="80%">
      <stop offset="0%"  stop-color="#fff8d6"/>
      <stop offset="55%" stop-color="#ffb347"/>
      <stop offset="100%" stop-color="#a31919"/>
    </radialGradient>
  </defs>
  <circle cx="28" cy="28" r="24" fill="url(#og)" stroke="#fff" stroke-width="2"/>
  <text x="28" y="24" text-anchor="middle"
        font-family="'Space Grotesk', sans-serif"
        font-weight="700" font-size="11" fill="#3a0a0a">OVER</text>
  <text x="28" y="40" text-anchor="middle"
        font-family="'Space Grotesk', sans-serif"
        font-weight="700" font-size="16" fill="#fff"
        stroke="#3a0a0a" stroke-width="0.6">9000</text>
</svg>`.trim();

// --- helpers ---
function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
}

async function callApi(url, value) {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ input: value }),
    });
    return res.json();
}

function showError(msg, example, hint) {
    errorBox.hidden = false;
    let html = `<strong>Invalid input.</strong> ${escapeHtml(msg)}`;
    if (hint)    html += `<div style="margin-top:6px;">${escapeHtml(hint)}</div>`;
    if (example) html += `<div style="margin-top:6px;">Example: <code>${escapeHtml(example)}</code></div>`;
    errorBox.innerHTML = html;
}

function clearError()   { errorBox.hidden = true; errorBox.innerHTML = ''; }
function clearResults() { resultsBox.hidden = true; resultsList.innerHTML = ''; resultsCount.textContent = ''; }

// --- rendering ---
function renderItems(items, mode) {
    resultsList.innerHTML = '';
    if (!items.length) { resultsBox.hidden = true; return; }

    resultsTitle.textContent = mode === 'sorted'
        ? 'Sorted Alphabetically'
        : 'Submitted Numbers';

    items.forEach((item, i) => {
        const li = document.createElement('li');
        li.className = 'result-item';
        li.style.animationDelay = Math.min(i * 35, 600) + 'ms';

        const idx = `<span class="result-index">${i + 1}</span>`;

        if (item.isOver9000) {
            li.classList.add('is-over-9000');
            li.innerHTML = idx + `
                <div class="over-9000-badge"
                     data-tooltip="${escapeHtml(item.words)}"
                     aria-label="${escapeHtml(item.words)} — over nine thousand"
                     tabindex="0">
                    ${OVER_9000_SVG}
                    <div class="over-9000-text">
                        <strong>It's Over 9000!</strong>
                        <span>hover to reveal</span>
                    </div>
                </div>`;
        } else {
            li.innerHTML = idx + `
                <div class="result-stack">
                    <div class="result-words">${escapeHtml(item.words)}</div>
                    <div class="result-number">(${escapeHtml(item.number)})</div>
                </div>`;
        }
        resultsList.appendChild(li);
    });

    resultsCount.textContent = items.length + ' item' + (items.length === 1 ? '' : 's');
    resultsBox.hidden = false;
}

// --- custom tooltip ---
function showTooltip(target, text) {
    tooltipText.textContent = text;
    tooltip.hidden = false;
    tooltip.dataset.show = 'true';

    const r = target.getBoundingClientRect();
    const t = tooltip.getBoundingClientRect();
    let top  = r.top - t.height - 12;
    let left = r.left + r.width / 2 - t.width / 2;
    if (top < 12) top = r.bottom + 12;
    left = Math.max(12, Math.min(left, window.innerWidth - t.width - 12));

    tooltip.style.top  = top  + 'px';
    tooltip.style.left = left + 'px';
}

function hideTooltip() {
    tooltip.dataset.show = 'false';
    setTimeout(() => {
        if (tooltip.dataset.show === 'false') tooltip.hidden = true;
    }, 160);
}

document.addEventListener('mouseover', e => {
    const b = e.target.closest('.over-9000-badge');
    if (b && b.dataset.tooltip) showTooltip(b, b.dataset.tooltip);
});
document.addEventListener('mouseout', e => {
    const b = e.target.closest('.over-9000-badge');
    if (b && !b.contains(e.relatedTarget)) hideTooltip();
});
document.addEventListener('focusin', e => {
    const b = e.target.closest('.over-9000-badge');
    if (b && b.dataset.tooltip) showTooltip(b, b.dataset.tooltip);
});
document.addEventListener('focusout', hideTooltip);
window.addEventListener('scroll', hideTooltip, { passive: true });
window.addEventListener('resize', hideTooltip);

// --- actions ---
async function handleSubmit() {
    clearError();
    submitBtn.disabled = true;
    try {
        const data = await callApi('/api/submit', input.value);
        if (!data.ok) {
            lastSubmitted = null;
            sortBtn.disabled = true;
            clearResults();
            showError(data.error, data.example, data.hint);
            return;
        }
        lastSubmitted = input.value;
        sortBtn.disabled = data.results.length === 0;
        renderItems(data.results, 'submitted');
    } catch {
        showError('Could not contact the server. Make sure it is running.', undefined,
                  'Run "npm start", then open http://localhost:3000.');
        clearResults();
    } finally {
        submitBtn.disabled = false;
    }
}

async function handleSort() {
    if (lastSubmitted === null) return;
    clearError();
    sortBtn.disabled = true;
    try {
        const data = await callApi('/api/sort', lastSubmitted);
        if (!data.ok) { showError(data.error, data.example, data.hint); clearResults(); return; }
        renderItems(data.results, 'sorted');
    } catch {
        showError('Could not contact the server.');
    } finally {
        sortBtn.disabled = lastSubmitted === null;
    }
}

// --- wiring ---
form.addEventListener('submit', e => { e.preventDefault(); handleSubmit(); });
sortBtn.addEventListener('click', handleSort);

clearBtn.addEventListener('click', () => {
    input.value = '';
    lastSubmitted = null;
    sortBtn.disabled = true;
    clearError();
    clearResults();
    input.focus();
});

exampleBtn.addEventListener('click', () => {
    input.value = '1, 2, 3, 11, 8999, 16, -42, 9000022324';
    input.focus();
});

// Editing the textarea after a submit means Sort needs a fresh submit first.
input.addEventListener('input', () => {
    if (lastSubmitted !== null && input.value !== lastSubmitted) {
        lastSubmitted = null;
        sortBtn.disabled = true;
        clearResults();
    }
    clearError();
});

input.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); handleSubmit(); }
});
