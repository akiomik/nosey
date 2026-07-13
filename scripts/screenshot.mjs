// Quick manual-QA helper: screenshot a running dev/preview server.
//
// Usage:
//   npm run screenshot -- <path> [output-name]
//
// Examples:
//   npm run screenshot -- /                     # screenshots/home.png
//   npm run screenshot -- "/?q=nostr" search     # screenshots/search.png
//
// Requires the app to already be running (npm run dev / npm run preview).
// Reads the base URL from BASE_URL (defaults to http://localhost:5173).

import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const baseUrl = process.env.BASE_URL ?? 'http://localhost:5173';
const path = process.argv[2] ?? '/';
const name = process.argv[3] ?? (path.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '') || 'home');

const outDir = new URL('../screenshots/', import.meta.url);
await mkdir(outDir, { recursive: true });
const outPath = fileURLToPath(new URL(`${name}.png`, outDir));

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
// `networkidle` never fires here: rx-nostr keeps relay WebSockets open, and
// the dev server keeps an HMR socket open too. `load` + a short fixed wait
// is good enough for a manual QA screenshot.
await page.goto(new URL(path, baseUrl).toString());
await page.waitForTimeout(1000);
await page.screenshot({ path: outPath, fullPage: true });
await browser.close();

console.log(`saved ${outPath}`);
