import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../', import.meta.url));
const publicDir = join(root, 'public');
const origin = 'https://hyu-man.com';

function* pageFiles(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* pageFiles(path);
    else if (entry.name === 'index.html') yield path;
  }
}

function attribute(tag, name) {
  return tag.match(new RegExp(`\\b${name}\\s*=\\s*(["'])(.*?)\\1`, 'i'))?.[2] ?? '';
}

const pages = [];
for (const file of pageFiles(publicDir)) {
  const html = readFileSync(file, 'utf8');
  const head = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i)?.[1] ?? '';
  const meta = head.match(/<meta\b[^>]*>/gi) ?? [];
  const noindex = meta.some(tag =>
    /^(robots|googlebot)$/i.test(attribute(tag, 'name')) &&
    /\b(noindex|none)\b/i.test(attribute(tag, 'content')));
  if (noindex) continue;

  const path = relative(publicDir, dirname(file)).split(sep).join('/');
  const url = `${origin}/${path ? path + '/' : ''}`;
  const canonicalTags = (head.match(/<link\b[^>]*>/gi) ?? [])
    .filter(tag => attribute(tag, 'rel').toLowerCase().split(/\s+/).includes('canonical'));
  if (canonicalTags.length !== 1) throw Error(`Expected one canonical URL: ${file}`);
  const canonical = attribute(canonicalTags[0], 'href');
  if (!canonical.startsWith(origin + '/') || /[?#]/.test(canonical)) {
    throw Error(`Invalid canonical URL in ${file}: ${canonical}`);
  }
  pages.push({ url, canonical });
}

// Older editions point to their current page; noindex pages stay out of the sitemap.
const urls = pages.filter(page => page.url === page.canonical).map(page => page.url).sort();
const indexable = new Set(urls);
for (const page of pages) {
  if (!indexable.has(page.canonical)) throw Error(`Canonical target is missing or noindex: ${page.canonical}`);
}
const escapeXml = value => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
// Omit lastmod: deployment time is not the date of a substantive content change.
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  urls.map(url => `  <url><loc>${escapeXml(url)}</loc></url>`).join('\n') + '\n</urlset>\n';

for (const output of [join(root, 'sitemap.xml'), join(publicDir, 'sitemap.xml')]) {
  if (process.argv.includes('--check')) {
    if (readFileSync(output, 'utf8') !== xml) throw Error(`Outdated sitemap: ${output}`);
  } else if (readFileSync(output, 'utf8') !== xml) {
    writeFileSync(output, xml);
  }
}
console.log(`Sitemap ${process.argv.includes('--check') ? 'verified' : 'prepared'}: ${urls.length} canonical pages.`);
