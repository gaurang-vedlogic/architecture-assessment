#!/usr/bin/env node
// Build the client-scoped Review-dashboard.html.
//
// A dashboard belongs to exactly one client and ships beside that client's reports — it
// never mixes assessments from different clients. Scope is taken from `meta.client`.
//
//   node tools/portfolio.mjs --input assessments/<slug>.assessment.json   # client of that assessment
//   node tools/portfolio.mjs --client "Novello Healthcare"                # by name
//   node tools/portfolio.mjs --client "Novello Healthcare" --out <dir>    # explicit destination
//   node tools/portfolio.mjs --all --out <dir>                            # INTERNAL: every client, never shipped
//
// Without --out the dashboard is written to `<repoPath>/architecture-review/` of every
// repository that client's assessments name, so each client repo carries the same, current
// roll-up next to its architecture review.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderDashboard } from './dashboard.mjs';
import { validate } from './derive.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const DASHBOARD_NAME = 'Review-dashboard.html';

const normClient = (c) => String(c ?? '').trim().toLowerCase();

/** Every valid assessment in a directory (invalid ones are skipped with a message). */
export function loadAssessments(dir = path.join(ROOT, 'assessments')) {
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.endsWith('.assessment.json'))) {
    const file = path.join(dir, f);
    const a = JSON.parse(fs.readFileSync(file, 'utf8'));
    const { errors } = validate(a);
    if (errors.length) {
      console.error(`  skipping ${f} — ${errors.length} validation error(s):`);
      for (const e of errors) console.error(`    ERROR ${e}`);
      continue;
    }
    out.push(a);
  }
  return out;
}

/** Distinct client names across a set of assessments, in first-seen order. */
export function listClients(assessments) {
  const seen = new Map();
  for (const a of assessments) {
    const k = normClient(a.meta.client);
    if (k && !seen.has(k)) seen.set(k, a.meta.client.trim());
  }
  return [...seen.values()];
}

/**
 * Render one client's dashboard.
 *
 * @param {object} opts
 * @param {string}   opts.client   Client name (matched case-insensitively against meta.client).
 * @param {string}  [opts.out]     Explicit output directory. When omitted, every existing
 *                                 `<repoPath>/architecture-review/` among the client's
 *                                 assessments receives a copy; if none exists, output/.
 * @param {object[]} [opts.assessments]  Pre-loaded assessments (defaults to assessments/).
 * @param {object}  [opts.branding]
 * @returns {{ written: string[], apps: number, client: string }}
 */
export function buildClientDashboard({ client, out, assessments, branding } = {}) {
  const all = assessments ?? loadAssessments();
  const key = normClient(client);
  if (!key) throw new Error('A client name is required — dashboards are per client.');
  const mine = all.filter((a) => normClient(a.meta.client) === key);
  if (!mine.length) {
    throw new Error(`No assessments found for client "${client}". Known clients: ${listClients(all).join(', ') || 'none'}`);
  }
  const brand = branding ?? JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'branding.json'), 'utf8'));
  const clientName = mine[0].meta.client.trim();

  // Where to write: explicit --out, else beside every report of this client.
  let dirs;
  if (out) {
    dirs = [path.resolve(out)];
  } else {
    dirs = [...new Set(
      mine
        .map((a) => a.meta.repoPath)
        .filter((p) => p && fs.existsSync(path.resolve(p)))
        .map((p) => path.join(path.resolve(p), 'architecture-review'))
    )];
    if (!dirs.length) dirs = [path.join(ROOT, 'output')];
  }

  // Deterministic: the newest review date across the set, not the wall clock.
  const generatedOn = mine.map((a) => a.meta.reviewDate).sort().at(-1);

  const written = [];
  for (const dir of dirs) {
    fs.mkdirSync(dir, { recursive: true });
    const html = renderDashboard(mine, brand, { generatedOn, outDir: dir, client: clientName });
    const file = path.join(dir, DASHBOARD_NAME);
    fs.writeFileSync(file, html);
    written.push(file);
  }
  return { written, apps: mine.length, client: clientName };
}

// ── CLI ───────────────────────────────────────────────────────────────────────
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const a = process.argv[i];
    if (a.startsWith('--')) {
      const next = process.argv[i + 1];
      if (next && !next.startsWith('--')) { args[a.slice(2)] = next; i++; }
      else args[a.slice(2)] = true;
    }
  }

  const dir = args.dir ? path.resolve(ROOT, args.dir) : path.join(ROOT, 'assessments');
  const all = loadAssessments(dir);
  if (!all.length) {
    console.error(`No valid *.assessment.json found in ${dir}`);
    process.exit(1);
  }

  try {
    if (args.all) {
      // Internal, cross-client view. Never write this into a client repo.
      const outDir = path.resolve(args.out ?? path.join(ROOT, 'output'));
      const branding = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'branding.json'), 'utf8'));
      const generatedOn = all.map((a) => a.meta.reviewDate).sort().at(-1);
      fs.mkdirSync(outDir, { recursive: true });
      fs.writeFileSync(path.join(outDir, DASHBOARD_NAME), renderDashboard(all, branding, { generatedOn, outDir, client: null }));
      console.log(`\n  INTERNAL cross-client dashboard: ${all.length} application(s) across ${listClients(all).length} client(s).`);
      console.log(`  Written to ${outDir}\\${DASHBOARD_NAME} — do not ship this to a client.\n`);
      process.exit(0);
    }

    let client = args.client;
    if (!client && args.input) {
      const a = JSON.parse(fs.readFileSync(path.resolve(args.input), 'utf8'));
      client = a.meta?.client;
    }
    if (!client) {
      console.error('Usage: node tools/portfolio.mjs (--input <assessment.json> | --client "<name>") [--out <dir>]');
      console.error('       node tools/portfolio.mjs --all [--out <dir>]     (internal, spans clients)');
      console.error(`\nKnown clients: ${listClients(all).map((c) => `"${c}"`).join(', ')}`);
      process.exit(1);
    }

    const { written, apps, client: name } = buildClientDashboard({ client, out: args.out, assessments: all });
    console.log(`\n  ${name}: ${apps} application(s) rolled up.`);
    console.log(`  Written:`);
    for (const f of written) console.log(`    ${f}`);
    console.log('');
  } catch (err) {
    console.error(`\n${err.message}\n`);
    process.exit(1);
  }
}
