// One-time authoring helper. The website runs with the included assets and no dependencies.
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const assets = fileURLToPath(new URL('../public/assets/', import.meta.url));
await fs.mkdir(path.join(assets, 'fonts'), { recursive: true });
const userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
const fonts = [
  { name: 'cormorant', family: 'Cormorant+Garamond:wght@300..700', license: 'cormorantgaramond' },
  { name: 'jakarta', family: 'Plus+Jakarta+Sans:wght@200..800', license: 'plusjakartasans' }
];
for (const font of fonts) {
  const response = await fetch(`https://fonts.googleapis.com/css2?family=${font.family}&display=swap`, { headers: { 'User-Agent': userAgent } });
  if (!response.ok) throw new Error(`Font stylesheet failed: ${response.status}`);
  const css = await response.text();
  const latin = css.split('/* latin */').at(-1);
  const url = /url\((https:[^)]+)\)/.exec(latin)?.[1];
  if (!url?.endsWith('.woff2')) throw new Error(`Missing WOFF2 for ${font.name}`);
  const file = await fetch(url);
  if (!file.ok) throw new Error(`Font download failed: ${file.status}`);
  await fs.writeFile(path.join(assets, 'fonts', `${font.name}-latin.woff2`), Buffer.from(await file.arrayBuffer()));
  const license = await fetch(`https://raw.githubusercontent.com/google/fonts/main/ofl/${font.license}/OFL.txt`);
  if (!license.ok) throw new Error(`Font license failed: ${license.status}`);
  await fs.writeFile(path.join(assets, 'fonts', `${font.name}-OFL.txt`), await license.text());
  console.log(`Prepared self-hosted ${font.name} font`);
}
const require = createRequire(import.meta.url);
const sharp = require(process.env.TPA_SHARP_PATH || 'sharp');
const source = fileURLToPath(new URL('../../design-assets/tpa/kolkata-watercolor.png', import.meta.url));
await sharp(source).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 100 }).toFile(path.join(assets, 'kolkata-watercolor.webp'));
console.log('Prepared transparent Kolkata watercolor illustration');
const knowledgeSource = fileURLToPath(new URL('../../design-assets/tpa/book-knowledge-watercolor.png', import.meta.url));
await sharp(knowledgeSource).resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 100 }).toFile(path.join(assets, 'book-knowledge-watercolor.webp'));
console.log('Prepared book knowledge-page watercolor illustration');
const communitySource = fileURLToPath(new URL('../../design-assets/tpa/book-community-watercolor.png', import.meta.url));
await sharp(communitySource).resize({ width: 1000, withoutEnlargement: true }).webp({ quality: 88, alphaQuality: 100 }).toFile(path.join(assets, 'book-community-watercolor.webp'));
console.log('Prepared book community-page watercolor illustration');
