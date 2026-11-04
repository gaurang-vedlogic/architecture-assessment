#!/usr/bin/env node
// Remediation plan — a Markdown work order generated from an assessment, written for the
// engineer (or coding agent) who will fix the findings inside the assessed repository.
//
//   node tools/remediation.mjs --input assessments/<slug>.assessment.json [--out <dir>] [--phase 1]
//
// Writes REMEDIATION-<app>.md beside the report (same directory rules as report.mjs).
// It is generated from assessment.json like every other output — never hand-edit it.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { derive, validate } from './derive.mjs';
import { resolveOutDir } from './report.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const PRIORITY_WORD = { P0: 'Critical — fix first', P1: 'High — next 1–2 sprints', P2: 'Medium — scheduled' };

function fence(code, lang = '') {
  return `\`\`\`${lang}\n${String(code).replace(/\n$/, '')}\n\`\`\``;
}

function evidenceList(ev = []) {
  return ev
    .map((e) => {
      const loc = e.line ? `${e.file}:${e.line}` : e.file;
      const parts = [`- \`${loc}\``];
      if (e.snippet) parts.push(`\n  ${fence(e.snippet)}`.replace(/\n/g, '\n  '));
      if (e.note) parts.push(`\n  ${e.note}`);
      return parts.join('');
    })
    .join('\n');
}

function findingSection(f, a) {
  const inv = (a.systemModel?.invariants ?? []).filter((i) => i.findingId === f.id);
  const notes = (a.executionNotes ?? []).filter((n) => n.findingRefs?.includes(f.id));
  const lines = [];
  lines.push(`### ${f.id} — ${f.title}`);
  lines.push('');
  for (const n of notes) { lines.push(`> **Execution note — ${n.title}.** See "Read this first" above.`); lines.push(''); }
  const meta = [
    `**Priority:** ${f.priority} (${PRIORITY_WORD[f.priority] ?? ''})`,
    `**Criticality:** ${f.criticality}`,
    `**Layer:** ${f.layer}`,
    f.confidence ? `**Confidence:** ${f.confidence}` : null,
    f.effortDays != null ? `**Effort:** ${f.effortDays} man-day${f.effortDays === 1 ? '' : 's'}` : '**Effort:** needs a spike',
    f.role ? `**Role:** ${f.role}` : null,
    f.ruleId ? `**Rule:** \`${f.ruleId}\`` : null,
  ].filter(Boolean);
  lines.push(meta.join(' · '));
  lines.push('');
  if (f.confidence === 'Needs-runtime-check') {
    lines.push(`> **Verify first.** This finding depends on a runtime or environment fact the review could not see. Confirm it before changing code; if it does not hold, record why and skip.`);
    lines.push('');
  }
  if (f.claim) { lines.push(`**Problem.** ${f.claim}`); lines.push(''); }
  if (f.evidence?.length) {
    lines.push('**Where.**');
    lines.push(evidenceList(f.evidence));
    if (f.instances) lines.push(`\n_${f.instances} instances in total — the references above are representative. Fix all of them._`);
    lines.push('');
  }
  if (f.remediation) { lines.push(`**Fix.** ${f.remediation}`); lines.push(''); }
  if (f.sampleFix) { lines.push('**Starting point.**'); lines.push(fence(f.sampleFix)); lines.push(''); }
  lines.push('**Done when.**');
  for (const i of inv) lines.push(`- [ ] Invariant restored: _${i.statement}_`);
  lines.push(`- [ ] The evidence sites above no longer exhibit the problem, and a search for the same pattern elsewhere finds nothing.`);
  lines.push(`- [ ] A test (unit, policy or integration) fails on the old behaviour and passes on the new.`);
  if (f.impact) lines.push(`- [ ] Outcome achieved: ${f.impact}`);
  lines.push('');
  return lines.join('\n');
}

function gapSection(g) {
  const lines = [];
  lines.push(`### GAP — ${g.capability}`);
  lines.push('');
  const meta = [
    `**Priority:** ${g.priority ?? 'P2'}`,
    g.status ? `**Status:** ${g.status}` : null,
    g.layer ? `**Layer:** ${g.layer}` : null,
    g.effortDays != null ? `**Effort:** ${g.effortDays} man-day${g.effortDays === 1 ? '' : 's'}` : '**Effort:** needs a spike',
    g.role ? `**Role:** ${g.role}` : null,
  ].filter(Boolean);
  lines.push(meta.join(' · '));
  lines.push('');
  if (g.why) { lines.push(`**Why it matters here.** ${g.why}`); lines.push(''); }
  lines.push(`**Build.** ${g.recommendation}`);
  lines.push('');
  lines.push('**Done when.**');
  lines.push(`- [ ] The capability exists, is exercised by at least one real path, and is documented in the repo README.`);
  lines.push('');
  return lines.join('\n');
}

export function renderRemediation(a, d, { onlyPhase } = {}) {
  const m = a.meta;
  const app = m.productName || m.app;
  const phases = onlyPhase ? d.phases.filter((p) => p.number === Number(onlyPhase)) : d.phases;
  const out = [];

  out.push(`# Remediation plan — ${app}`);
  out.push('');
  out.push(`Generated from \`${m.app}.assessment.json\` (review dated ${m.reviewDate}). This file is a work order for the engineer or coding agent fixing the findings in this repository. It is generated — do not edit it by hand; change the assessment and regenerate.`);
  out.push('');
  out.push(`Full report with rationale, refuted candidates and scoring: \`architecture-review/ARCHITECTURE-REVIEW-${m.app}.html\`.`);
  out.push('');

  // ── Ground rules ────────────────────────────────────────────────────────────
  out.push('## Ground rules');
  out.push('');
  out.push('1. **Work phase by phase, in order.** Everything in Phase 1 is either a live risk or a prerequisite for later phases. Do not start Phase 2 items while a Phase 1 item is open unless told to.');
  out.push('2. **One finding per branch or commit**, referenced by its ID (e.g. `F3`), so the change can be reviewed against the finding it closes.');
  out.push('3. **Read the evidence before changing anything.** Each finding names the files and lines it was observed at; open them and confirm the problem is still present. If it has already been fixed or the review was wrong, say so and move on — do not force a change.');
  out.push('4. **Fix the pattern, not the site.** Where a finding lists representative references and an instance count, search for the same pattern across the codebase and fix every occurrence.');
  out.push('5. **Verify-first items** (marked *Needs-runtime-check*) require confirming an environment fact before coding. Do that check, record the result, and only then decide.');
  out.push('6. **Protect the strengths** listed at the end of this document. A fix that regresses one of them is not done.');
  out.push('7. **Every fix ships with a test** that fails on the old behaviour. If the repo has no test harness for that layer, setting one up is part of the first fix that needs it.');
  out.push('8. **Do not widen scope.** If a fix reveals a further problem, note it under "Discovered during remediation" at the bottom rather than fixing it silently.');
  out.push('');

  // ── Execution notes: decisions taken after the review ───────────────────────
  if (a.executionNotes?.length) {
    out.push('## Read this first — decisions taken after the review');
    out.push('');
    out.push('These change how the items below are executed. Where a note and a finding\'s "Fix" disagree, the note wins.');
    out.push('');
    for (const n of a.executionNotes) {
      const when = n.date ? ` _(${n.date})_` : '';
      out.push(`### ${n.title}${when}`);
      out.push('');
      out.push(n.text);
      if (n.findingRefs?.length) { out.push(''); out.push(`Applies to: ${n.findingRefs.map((r) => `\`${r}\``).join(', ')}`); }
      if (n.reference) { out.push(''); out.push(`See: \`${n.reference}\``); }
      out.push('');
    }
  }

  // ── Verify first ────────────────────────────────────────────────────────────
  const nrc = (a.findings ?? []).filter((f) => f.confidence === 'Needs-runtime-check');
  if (nrc.length) {
    out.push('## Verify first (before any code change)');
    out.push('');
    for (const f of nrc) out.push(`- [ ] **${f.id}** — ${f.title}. ${f.remediation?.split('. ')[0] ?? ''}.`);
    out.push('');
  }

  // ── Summary table ───────────────────────────────────────────────────────────
  out.push('## Work items at a glance');
  out.push('');
  out.push('| Phase | ID | Item | Priority | Effort (md) | Role |');
  out.push('| --- | --- | --- | --- | --- | --- |');
  for (const p of phases) {
    for (const f of p.items) out.push(`| ${p.number} | ${f.id} | ${f.title} | ${f.priority} | ${f.effortDays ?? '—'} | ${f.role ?? ''} |`);
    for (const g of p.gapItems) out.push(`| ${p.number} | GAP | ${g.capability} | ${g.priority ?? 'P2'} | ${g.effortDays ?? '—'} | ${g.role ?? ''} |`);
  }
  out.push(`| | | **Total** | | **${Number(phases.reduce((s, p) => s + p.days, 0).toFixed(1))}** | |`);
  out.push('');

  // ── Phases ──────────────────────────────────────────────────────────────────
  for (const p of phases) {
    out.push(`## Phase ${p.number} — ${p.name} (${p.days} man-days)`);
    out.push('');
    if (p.objective) { out.push(`_${p.objective}_`); out.push(''); }
    const order = { P0: 0, P1: 1, P2: 2 };
    const items = [...p.items].sort((x, y) => (order[x.priority] ?? 9) - (order[y.priority] ?? 9));
    for (const f of items) out.push(findingSection(f, a));
    const gaps = [...p.gapItems].sort((x, y) => (order[x.priority ?? 'P2'] ?? 9) - (order[y.priority ?? 'P2'] ?? 9));
    for (const g of gaps) out.push(gapSection(g));
  }

  // ── Protect ─────────────────────────────────────────────────────────────────
  if (a.positivePosture?.length) {
    out.push('## Protect these while fixing');
    out.push('');
    out.push('These were verified strengths at review time. Any change that weakens one must be called out explicitly.');
    out.push('');
    for (const p of a.positivePosture) out.push(`- **${p.title}.** ${p.detail}`);
    out.push('');
  }

  // ── Invariants checklist ────────────────────────────────────────────────────
  const invs = a.systemModel?.invariants ?? [];
  if (invs.length) {
    out.push('## Invariants — final acceptance');
    out.push('');
    out.push('Remediation is complete when every invariant below holds. Tick each one only with evidence (a test, a policy query, or a documented manual check).');
    out.push('');
    for (const i of invs) {
      const mark = i.status === 'HOLDS' ? '[x]' : '[ ]';
      const ref = i.findingId ? ` (${i.findingId})` : '';
      const note = i.note ? ` — ${i.note}` : '';
      out.push(`- ${mark} ${i.statement}${ref}${i.status !== 'HOLDS' ? ` _(${i.status})_` : ''}${note}`);
    }
    out.push('');
  }

  out.push('## Discovered during remediation');
  out.push('');
  out.push('_Record anything found while fixing that is outside the items above. These feed the next review._');
  out.push('');
  return out.join('\n');
}

export function generateRemediation(inputPath, opts = {}) {
  const a = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const { errors, derived: d } = validate(a);
  if (errors.length) {
    for (const e of errors) console.error(`  ERROR ${e}`);
    throw new Error(`${errors.length} validation error(s) — nothing generated.`);
  }
  const { dir } = resolveOutDir(a.meta, opts);
  fs.mkdirSync(dir, { recursive: true });
  const name = `REMEDIATION-${a.meta.app}.md`;
  fs.writeFileSync(path.join(dir, name), renderRemediation(a, d, { onlyPhase: opts.phase }) + '\n');
  return { file: path.join(dir, name), derived: d };
}

// CLI
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = {};
  for (let i = 2; i < process.argv.length; i++) {
    const x = process.argv[i];
    if (x.startsWith('--')) {
      const next = process.argv[i + 1];
      if (next && !next.startsWith('--')) { args[x.slice(2)] = next; i++; }
      else args[x.slice(2)] = true;
    }
  }
  if (!args.input) {
    console.error('Usage: node tools/remediation.mjs --input <assessment.json> [--out <dir>] [--phase <n>]');
    console.error('  Writes REMEDIATION-<app>.md beside the report — a work order for whoever fixes the findings.');
    process.exit(1);
  }
  try {
    const { file, derived } = generateRemediation(path.resolve(args.input), args);
    console.log(`\n  ${derived.total} findings · ${derived.gaps.length} gaps · ~${derived.totalDays} man-days`);
    console.log(`  Written: ${file}\n`);
  } catch (err) {
    console.error(`\n${err.message}\n`);
    process.exit(1);
  }
}
