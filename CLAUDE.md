# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**zink.** is a static, browser-based utility toolkit for writers, sellers, and marketers. Live at https://gotzink.com/. No framework, no build step, no dependencies — pure HTML/CSS/vanilla JS.

## Running Locally

```bash
python -m http.server 8000
# or
npx http-server
```

Open `http://localhost:8000` in a browser. No build step required.

## Deployment

Push to `main` — Cloudflare Pages deploys automatically from the repo root.

## Architecture

### Structure
- Each tool is a standalone HTML file at the root (`capitaliser.html`, `listing-builder.html`, `word-counter.html`, `keyword-density.html`)
- `index.html` is the tool hub/landing page
- `css/main.css` — all styles (design system via CSS variables, light/dark theming via `[data-theme]`)
- `js/app.js` — shared logic: theme toggle (persisted to localStorage), Google Analytics
- `js/tools/` — tool-specific JS loaded only on the relevant page

### Design System
- Font: Outfit (Google Fonts)
- Accent color: Indigo (`#6366f1`)
- Dark/light mode: toggled on `<html data-theme="dark|light">`
- Border radius: 12px (cards), 8px (inputs), 6px (badges)
- Max content width: 800px

### Tool Pattern
All tools follow the same UI structure: header (logo + theme toggle + back link) → tool UI (textarea inputs, controls, output) → no footer. Processing is real-time (on `input` events), fully client-side, no data leaves the browser.

### Key Utilities (inline in tool HTML files)
- `byteLength(str)` — UTF-8 byte counting (used for Amazon character limits)
- `trimToBytes(str, limit)` — truncates to byte limit
- `parseCSV(text)` — RFC 4180 CSV parser with quoted field support (listing builder)
- `convertCase(text, mode, style)` — central text transformation engine (capitaliser)

### Listing Builder Specifics
Keyword scoring formula: `score = (volume × (1 + sales)) ÷ max(compete, 1)`. Auto-detects column names from Helium 10 / Jungle Scout CSV exports. Outputs: Amazon title (200 bytes), backend search terms (249 bytes), 5 bullet points (1000 bytes each).

### Adding a New Tool
1. Create `toolname.html` at root (copy structure from an existing tool)
2. Add a card to `index.html`
3. Add `<meta name="robots" content="index, follow">` and OG tags to the new page
4. Add the URL to `sitemap.xml` and `robots.txt`
