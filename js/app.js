// ── Theme ────────────────────────────────────────────────────────────────────

const root     = document.documentElement;
const themeBtn = document.getElementById('theme-btn');
const sunIcon  = document.getElementById('icon-sun');
const moonIcon = document.getElementById('icon-moon');

function getStoredTheme() {
  return localStorage.getItem('zink-theme') ||
    (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
}

function applyTheme(t) {
  root.setAttribute('data-theme', t);
  localStorage.setItem('zink-theme', t);
  sunIcon.style.display  = t === 'dark'  ? 'block' : 'none';
  moonIcon.style.display = t === 'light' ? 'block' : 'none';
  themeBtn.title = t === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
}

applyTheme(getStoredTheme());
themeBtn.addEventListener('click', () =>
  applyTheme(root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark')
);

// ── State ─────────────────────────────────────────────────────────────────────

let activeStyle = 'APA';
let activeMode  = 'title';

const STYLES = [
  { id: 'APA',     name: 'American Psychological Association', desc: 'Used in psychology, social sciences, and education. Capitalises all words of 4+ letters.' },
  { id: 'Chicago', name: 'Chicago Manual of Style',            desc: 'The standard for book publishing, history, and humanities. Lowercases all prepositions regardless of length.' },
  { id: 'AP',      name: 'Associated Press',                   desc: 'The bible of journalism and news writing. Also widely used by bloggers and copywriters.' },
  { id: 'MLA',     name: 'Modern Language Association',        desc: 'Dominates English literature and humanities academia. Lowercases all prepositions.' },
  { id: 'Email',   name: 'Email Subject Line',                 desc: 'Optimised for professional email subject lines. Clean capitalisation that looks polished in any inbox.' },
];

// ── Element refs ──────────────────────────────────────────────────────────────

const inputEl   = document.getElementById('input-text');
const outputEl  = document.getElementById('output-text');
const copyBtn   = document.getElementById('copy-btn');
const clearBtn  = document.getElementById('clear-btn');
const wordCount = document.getElementById('word-count');
const descName  = document.getElementById('style-desc-name');
const descText  = document.getElementById('style-desc-text');

// ── Core update ───────────────────────────────────────────────────────────────

function updateOutput() {
  const raw    = inputEl.value;
  const result = raw.trim() ? convertCase(raw, activeMode, activeStyle) : '';

  if (result) {
    outputEl.textContent = result;
    outputEl.classList.add('has-content');
    copyBtn.disabled = false;
  } else {
    outputEl.textContent = 'Your converted title will appear here...';
    outputEl.classList.remove('has-content');
    copyBtn.disabled = true;
  }

  const words = raw.trim() ? raw.trim().split(/\s+/).filter(Boolean).length : 0;
  const chars = raw.length;
  const outChars = result.length;
  wordCount.textContent = result
    ? `${words} ${words === 1 ? 'word' : 'words'} · ${chars} ${chars === 1 ? 'char' : 'chars'} · output: ${outChars}`
    : `${words} ${words === 1 ? 'word' : 'words'} · ${chars} ${chars === 1 ? 'char' : 'chars'}`;
}

// ── Style switching ───────────────────────────────────────────────────────────

function setStyle(id) {
  activeStyle = id;
  document.querySelectorAll('.style-tab').forEach(b =>
    b.classList.toggle('active', b.dataset.style === id));
  document.querySelectorAll('.ref-card').forEach(c =>
    c.classList.toggle('active', c.dataset.style === id));
  const s = STYLES.find(s => s.id === id);
  descName.textContent = s.name;
  descText.textContent = '— ' + s.desc;
  updateOutput();
}

// ── Mode switching ────────────────────────────────────────────────────────────

function setMode(id) {
  activeMode = id;
  document.querySelectorAll('.mode-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.mode === id));
  updateOutput();
}

// ── Copy ──────────────────────────────────────────────────────────────────────

function doCopy() {
  if (!outputEl.classList.contains('has-content')) return;
  const text = outputEl.textContent;

  const confirm = () => {
    copyBtn.textContent = '✓ Copied';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = 'Copy';
      copyBtn.classList.remove('copied');
    }, 2000);
  };

  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(confirm).catch(() => fallbackCopy(text, confirm));
  } else {
    fallbackCopy(text, confirm);
  }
}

function fallbackCopy(text, cb) {
  const ta = document.createElement('textarea');
  ta.value = text;
  ta.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
  document.body.appendChild(ta);
  ta.select();
  document.execCommand('copy');
  document.body.removeChild(ta);
  cb();
}

// ── Event listeners ───────────────────────────────────────────────────────────

inputEl.addEventListener('input', updateOutput);
inputEl.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); doCopy(); }
});
clearBtn.addEventListener('click', () => { inputEl.value = ''; updateOutput(); inputEl.focus(); });
copyBtn.addEventListener('click', doCopy);
outputEl.addEventListener('click', doCopy);

document.querySelectorAll('.style-tab').forEach(b =>
  b.addEventListener('click', () => setStyle(b.dataset.style)));

document.querySelectorAll('.mode-btn').forEach(b =>
  b.addEventListener('click', () => setMode(b.dataset.mode)));

document.querySelectorAll('.ref-card').forEach(c =>
  c.addEventListener('click', () => setStyle(c.dataset.style)));

// ── Init ──────────────────────────────────────────────────────────────────────

setStyle('APA');
setMode('title');
