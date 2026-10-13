import fs from 'node:fs/promises';
const source = new URL('../public/', import.meta.url);
const output = new URL('../dist/', import.meta.url);
await fs.mkdir(output, { recursive: true });
await fs.cp(source, output, { recursive: true });
console.log('TPA static website built in tpa-site/dist/');
