// ── Byte utilities ────────────────────────────────────────────────────────────

const encoder = new TextEncoder();

function byteLength(str) {
  return encoder.encode(str).length;
}

function trimToBytes(str, maxBytes) {
  if (byteLength(str) <= maxBytes) return str;
  let result = '';
  let bytes = 0;
  for (const char of str) {
    const charBytes = byteLength(char);
    if (bytes + charBytes > maxBytes) break;
    result += char;
    bytes += charBytes;
  }
  return result.trimEnd();
}

// ── Auto-detect column names from common tools ────────────────────────────────

const KEYWORD_PATTERNS  = ['keyword phrase', 'keyword', 'search term', 'keyphrase', 'key phrase'];
const VOLUME_PATTERNS   = ['search volume', 'monthly search volume', 'volume', 'search_volume', 'avg monthly searches'];
const SALES_PATTERNS    = ['keyword sales', 'monthly sales', 'sales', 'conversions', 'est. sales', 'estimated sales'];
const COMPETE_PATTERNS  = ['competing products', 'competition', 'competing', 'results', 'total products', 'search results'];

function detectColumn(headers, patterns) {
  const lc = headers.map(h => h.toLowerCase().trim());
  for (const pattern of patterns) {
    const idx = lc.findIndex(h => h.includes(pattern));
    if (idx !== -1) return headers[idx];
  }
  return null;
}

// ── CSV parser ────────────────────────────────────────────────────────────────

function parseCSV(text) {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error('CSV must have at least a header row and one data row.');

  // Parse a single CSV line respecting quoted fields
  function parseLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
        else inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  }

  // Strip BOM if present
  const firstLine = lines[0].replace(/^\uFEFF/, '');
  const headers = parseLine(firstLine);
  const rows = [];

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const values = parseLine(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    rows.push(row);
  }

  return { headers, rows };
}

// ── Clean numeric strings like "120,919" or ">30,000" → number ───────────────

function toNumber(val) {
  if (val === undefined || val === null || val === '') return 0;
  const cleaned = String(val).replace(/[^0-9.]/g, '');
  return parseFloat(cleaned) || 0;
}

// ── Score and rank keywords ───────────────────────────────────────────────────

function scoreKeywords(rows, mapping) {
  return rows
    .map(row => {
      const keyword   = (row[mapping.keyword]  || '').trim().toLowerCase();
      const volume    = toNumber(row[mapping.volume]);
      const sales     = mapping.sales    ? toNumber(row[mapping.sales])   : 0;
      const compete   = mapping.compete  ? toNumber(row[mapping.compete]) : 1;

      if (!keyword) return null;

      // Priority score: volume × (1 + sales) ÷ max(compete, 1)
      const score = (volume * (1 + sales)) / Math.max(compete, 1);

      return { keyword, volume, sales, compete, score };
    })
    .filter(Boolean)
    .filter(k => k.volume > 0)
    .sort((a, b) => b.score - a.score);
}

// ── Deduplication helper ──────────────────────────────────────────────────────

function dedupeKeywords(keywords) {
  const seen = new Set();
  return keywords.filter(k => {
    if (seen.has(k.keyword)) return false;
    seen.add(k.keyword);
    return true;
  });
}

// ── Build backend search terms ────────────────────────────────────────────────
// Rules: space-separated, no commas, no repeats, 249 bytes max

function buildBackendTerms(keywords, maxBytes = 249) {
  const used = new Set();
  let result = '';

  for (const kw of keywords) {
    // Split multi-word keywords and add individual words too
    const words = kw.keyword.split(/\s+/);
    for (const word of words) {
      if (used.has(word)) continue;
      const candidate = result ? result + ' ' + word : word;
      if (byteLength(candidate) > maxBytes) break;
      result = candidate;
      used.add(word);
    }
  }

  return result.trim();
}

// ── Build product title ───────────────────────────────────────────────────────
// Rules: natural reading, pipe separators, 200 bytes max

function buildTitle(keywords, maxBytes = 200) {
  // Take top keywords and build a readable title
  const topKeywords = keywords.slice(0, 20).map(k => k.keyword);
  
  // Group into 2-3 word phrases for readability
  const segments = [];
  const used = new Set();
  let wordPool = [];

  // Collect all unique words from top keywords in order of importance
  for (const kw of topKeywords) {
    for (const word of kw.split(/\s+/)) {
      if (!used.has(word)) {
        wordPool.push(word);
        used.add(word);
      }
    }
  }

  // Build segments of 2-4 words each
  let i = 0;
  while (i < wordPool.length && segments.length < 6) {
    const segSize = Math.min(3, wordPool.length - i);
    const seg = wordPool.slice(i, i + segSize)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');
    segments.push(seg);
    i += segSize;
  }

  // Join with pipes, trim to byte limit
  let title = segments.join(' | ');
  if (byteLength(title) > maxBytes) {
    title = trimToBytes(title, maxBytes);
    // Clean up trailing pipe
    title = title.replace(/\s*\|?\s*$/, '').trim();
  }

  return title;
}

// ── Build bullet points ───────────────────────────────────────────────────────
// 5 bullets, 1000 bytes each, keyword-rich feature sentences

const BULLET_OPENERS = [
  'PREMIUM QUALITY',
  'PERFECT FIT',
  'VERSATILE STYLE',
  'EVERYDAY COMFORT',
  'GREAT VALUE',
];

function buildBullets(keywords, maxBytes = 1000) {
  const bullets = [];
  const usedKeywords = new Set();

  // Distribute keywords across 5 bullets
  // First bullet gets top keywords, subsequent ones get next tier
  const chunkSize = Math.ceil(keywords.length / 5);

  for (let b = 0; b < 5; b++) {
    const chunk = keywords
      .slice(b * chunkSize, (b + 1) * chunkSize)
      .filter(k => !usedKeywords.has(k.keyword))
      .slice(0, 8);

    chunk.forEach(k => usedKeywords.add(k.keyword));

    if (chunk.length === 0) {
      bullets.push(BULLET_OPENERS[b] + ': High-quality product designed to meet your needs.');
      continue;
    }

    const opener = BULLET_OPENERS[b];
    const topKw = chunk[0].keyword;
    const rest  = chunk.slice(1).map(k => k.keyword);

    // Build the bullet sentence
    let bullet = `${opener}: `;
    bullet += topKw.charAt(0).toUpperCase() + topKw.slice(1);
    bullet += ' — ';
    bullet += rest.slice(0, 4).join(', ');
    bullet += rest.length > 4 ? ', and more.' : '.';

    // Add filler keywords to fill up remaining bytes
    const remaining = chunk.slice(5);
    for (const kw of remaining) {
      const addition = ' ' + kw.keyword + '.';
      if (byteLength(bullet + addition) <= maxBytes) {
        bullet += addition;
      }
    }

    bullets.push(trimToBytes(bullet, maxBytes));
  }

  return bullets;
}

// ── Master generate function ──────────────────────────────────────────────────

function generateListing(rows, mapping, filters) {
  let keywords = scoreKeywords(rows, mapping);

  // Apply filters
  if (filters.minVolume > 0) {
    keywords = keywords.filter(k => k.volume >= filters.minVolume);
  }
  if (filters.maxCompete > 0 && mapping.compete) {
    keywords = keywords.filter(k => k.compete <= filters.maxCompete);
  }

  keywords = dedupeKeywords(keywords);

  if (keywords.length === 0) {
    throw new Error('No keywords matched your filters. Try lowering the minimum search volume.');
  }

  return {
    keywords,
    title:   buildTitle(keywords),
    backend: buildBackendTerms(keywords),
    bullets: buildBullets(keywords),
  };
}
