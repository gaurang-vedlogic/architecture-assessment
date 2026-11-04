#!/usr/bin/env node
// Validate an assessment file without generating anything.
//   node tools/validate.mjs --input assessments/foo.assessment.json
import fs from 'node:fs';
import path from 'node:path';
import { validate } from './derive.mjs';

const args = {};
for (let i = 2; i < process.argv.length; i++) {
  const a = process.argv[i];
  if (a.startsWith('--')) {
    const next = process.argv[i + 1];
    if (next && !next.startsWith('--')) { args[a.slice(2)] = next; i++; }
    else args[a.slice(2)] = true;
  }
}

const input = args.input ?? args._;
if (!input) {
  console.error('Usage: node tools/validate.mjs --input <assessment.json>');
  process.exit(1);
}

const a = JSON.parse(fs.readFileSync(path.resolve(input), 'utf8'));
const { errors, warnings, derived } = validate(a);

console.log(`\n${path.basename(input)}`);
console.log(`  ${derived.total} findings  ·  P0=${derived.counts.P0} P1=${derived.counts.P1} P2=${derived.counts.P2}`);
console.log(`  ${derived.phases.length} phases  ·  ~${derived.totalDays} man-days`);
console.log(`  overall maturity ${derived.overall.toFixed(1)}/5  ·  target ${derived.targetMean.toFixed(1)}/5`);
console.log(`  layers: ${derived.layers.join(', ') || 'none'}`);

if (warnings.length) {
  console.log(`\n  ${warnings.length} warning(s):`);
  for (const w of warnings) console.log(`    warn  ${w}`);
}
if (errors.length) {
  console.log(`\n  ${errors.length} error(s):`);
  for (const e of errors) console.log(`    ERROR ${e}`);
  console.log('');
  process.exit(1);
}
console.log(errors.length ? '' : '\n  Valid.\n');
