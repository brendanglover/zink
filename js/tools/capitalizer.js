// ── Word sets ────────────────────────────────────────────────────────────────

const ARTICLES   = new Set(['a','an','the']);
const COORD_CONJ = new Set(['and','but','for','nor','or','so','yet']);

// Short prepositions (≤3 letters) — lowercased in APA, AP, Email
const SHORT_PREPS = new Set([
  'as','at','by','in','of','off','on','per','to','up','via',
]);

// All prepositions — lowercased in Chicago & MLA regardless of length
const ALL_PREPS = new Set([
  'about','above','across','after','against','along','amid','among','around',
  'as','at','atop','before','behind','below','beneath','beside','besides',
  'between','beyond','by','circa','despite','down','during','except','for',
  'from','in','inside','into','like','minus','near','of','off','on','onto',
  'opposite','out','outside','over','past','per','plus','regarding','round',
  'since','than','through','throughout','till','to','toward','towards','under',
  'underneath','unlike','until','unto','up','upon','versus','via','with',
  'within','without',
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

const cap = w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();

// Preserve special casing: AI, NASA, iPhone, eBay, macOS, ChatGPT
function preservedCase(word) {
  if (word.length > 1 && word === word.toUpperCase() && /[A-Z]/.test(word)) return word;
  if (/^[a-z].*[A-Z]/.test(word) || /^[A-Z][a-z]+[A-Z]/.test(word)) return word;
  return null;
}

function shouldLower(word, style) {
  switch (style) {
    case 'APA':
    case 'AP':
    case 'Email':
      if (word.length >= 4) return false;
      return ARTICLES.has(word) || COORD_CONJ.has(word) || SHORT_PREPS.has(word);
    case 'Chicago':
    case 'MLA':
      return ARTICLES.has(word) || COORD_CONJ.has(word) || ALL_PREPS.has(word);
    default:
      return false;
  }
}

// ── Title case ───────────────────────────────────────────────────────────────

function toTitleCase(text, style) {
  if (!text.trim()) return text;
  const words = text.split(' ');
  return words.map((token, idx) => {
    if (!token) return token;
    const m = token.match(/^([^a-zA-Z0-9]*)([a-zA-Z0-9][a-zA-Z0-9''`\-]*)([^a-zA-Z0-9]*)$/);
    if (!m) return token;
    const [, pre, core, suf] = m;
    const lc = core.toLowerCase();
    const isFirst    = idx === 0;
    const isLast     = idx === words.length - 1;
    const afterBreak = /[:\u2014\u2013]/.test(words[idx - 1] || '');
    if (isFirst || isLast || afterBreak) return pre + (preservedCase(core) ?? cap(core)) + suf;
    const preserved = preservedCase(core);
    if (preserved) return pre + preserved + suf;
    return pre + (shouldLower(lc, style) ? lc : cap(core)) + suf;
  }).join(' ');
}

// ── Main export ───────────────────────────────────────────────────────────────

function convertCase(text, mode, style) {
  if (!text) return '';
  switch (mode) {
    case 'title':    return toTitleCase(text, style);
    case 'sentence': return text.toLowerCase()
      .replace(/(^|[.!?]\s+)([a-z])/g, (_, sep, c) => sep + c.toUpperCase());
    case 'upper':    return text.toUpperCase();
    case 'lower':    return text.toLowerCase();
    case 'first':    return text.replace(/\b([a-zA-Z])/g, c => c.toUpperCase());
    case 'alt': {
      let i = 0;
      return text.split('').map(c =>
        /[a-zA-Z]/.test(c) ? (i++ % 2 === 0 ? c.toUpperCase() : c.toLowerCase()) : c
      ).join('');
    }
    case 'toggle':   return text.split('').map(c =>
      c === c.toUpperCase() ? c.toLowerCase() : c.toUpperCase()
    ).join('');
    default:         return text;
  }
}
