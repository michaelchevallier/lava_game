#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LEVELS_DIR = path.join(__dirname, '..', 'src-v2', 'data', 'levels');

const FIRST_WAVE_MIN = 12000;

const files = fs.readdirSync(LEVELS_DIR)
  .filter((f) => f.startsWith('world') && f.endsWith('.json'))
  .map((f) => path.join(LEVELS_DIR, f));

let changed = 0;
for (const f of files) {
  const data = JSON.parse(fs.readFileSync(f, 'utf8'));
  if (!data.waves || data.waves.length === 0) continue;
  const before = data.waves[0].delayMs;
  if (before < FIRST_WAVE_MIN) {
    data.waves[0].delayMs = FIRST_WAVE_MIN;
    fs.writeFileSync(f, JSON.stringify(data, null, 2) + '\n', 'utf8');
    console.log(`  ${path.basename(f)}: ${before} -> ${FIRST_WAVE_MIN}`);
    changed++;
  }
}
console.log(`\n${changed}/${files.length} levels updated.`);
