#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEVELS_DIR = path.join(__dirname, '..', 'src-v2', 'data', 'levels');

const FLOOR = 350;

const files = fs.readdirSync(LEVELS_DIR)
  .filter((f) => f.startsWith('world') && f.endsWith('.json'))
  .map((f) => path.join(LEVELS_DIR, f));

let changed = 0;
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  const before = data.startCoins ?? 0;
  if (before < FLOOR) {
    data.startCoins = FLOOR;
    fs.writeFileSync(f, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`  ${path.basename(f)}: ${before} -> ${FLOOR}`);
    changed++;
  }
}
console.log(`\n${changed}/${files.length} levels updated.`);
