import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';

// Vite inlines the planner JS and CSS. APK releases stay online-only.
const manifest = JSON.parse(await readFile('dist/manifest.webmanifest', 'utf8'));
const urls = [...new Set(['/index.html', '/manifest.webmanifest', '/icons/apple-touch-icon.png',
  ...manifest.icons.map(icon => icon.src)])];
const worker = await readFile('scripts/service-worker.js', 'utf8');
const digest = createHash('sha256').update(worker);
for (const url of urls) digest.update(await readFile('dist' + url));
const name = 'billsort-shell-' + digest.digest('hex').slice(0, 16);
await writeFile('dist/sw.js', worker
  .replace('__CACHE_NAME__', JSON.stringify(name))
  .replace('__SHELL_URLS__', JSON.stringify(urls)));
