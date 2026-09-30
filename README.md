# 50 Lines — Friends Quotes

A single-page, scrapbook-style tribute to 50 iconic *Friends* lines from all six friends (plus a couple of unforgettable cameos). Click or tab to any quote card for a surprise.

## Run it locally

This is a static HTML page — no build step, no dependencies. Two ways to view it:

**Just open the file:**

```bash
start friends-quotes.html   # Windows
```

**Or serve it** (needed for some browser features to behave like a real hosted page):

```powershell
powershell -File serve.ps1
```

Then open http://localhost:8877.

## Project structure

```
friends-quotes.html   the page itself (markup, styles, and script inline)
tests/                browser-console test suite (see below)
serve.ps1             tiny static file server for local preview
```

## Testing

`tests/friends-quotes.tests.js` is a dependency-free test suite you run in the browser:

1. Open the page (locally or via `serve.ps1`).
2. Paste the contents of `tests/friends-quotes.tests.js` into the DevTools console.
3. It logs a results table and returns pass/fail for each check — quote count and uniqueness, numbering, responsive grid columns, keyboard/screen-reader accessibility of the quote cards, and cleanup of the click-triggered animation.

## Features

- 50 curated quotes across all six friends, in a responsive scrapbook grid (4 columns on desktop, 2 on tablet, 1 on mobile).
- Click or press Enter/Space on any quote card to trigger a screen-wide burst of animated orange cats.
- Light/dark theme aware.
