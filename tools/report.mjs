#!/usr/bin/env node
// Report generator CLI. HTML is the primary and default output format.
//   node tools/report.mjs --input assessments/foo.assessment.json [--out output] [--docx]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { derive, validate } from './derive.mjs';
import * as charts from './charts.mjs';
import { renderArchitectureReview } from './architecture-review.mjs';
import { buildClientDashboard, DASHBOARD_NAME } from './portfolio.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith('--')) { args[key] = next; i++; }
      else args[key] = true;
    }
  }
  return args;
}

/** Read the natural size out of an SVG root element so we can scale it for DOCX. */
function svgSize(svg) {
  const w = Number(svg.match(/width="(\d+(?:\.\d+)?)"/)?.[1] ?? 800);
  const h = Number(svg.match(/height="(\d+(?:\.\d+)?)"/)?.[1] ?? 500);
  return { w, h };
}

/** Rasterise at 2x for crisp images in Word. Only used for the optional DOCX output,
 *  so `sharp` is imported lazily and is not needed for the default HTML path. */
async function raster(svg, sharp) {
  const { w, h } = svgSize(svg);
  const png = await sharp(Buffer.from(svg), { density: 144 })
    .resize({ width: Math.round(w * 2) })
    .png()
    .toBuffer();
  return { png, w, h, svg };
}

/**
 * Where the report is written, in precedence order:
 *   1. --out            explicit, always wins
 *   2. meta.repoPath    <repo>/architecture-review — the deliverable ships with the code
 *   3. output/          this tool's own directory, for assessments with no repo on disk
 * Returns { dir, inRepo } — `inRepo` is false for case 3, which is the only case
 * where the portfolio dashboard is a sibling file worth linking to.
 */
export function resolveOutDir(meta = {}, opts = {}) {
  if (opts.out) return { dir: path.resolve(opts.out), inRepo: false };
  const repo = meta.repoPath;
  if (repo) {
    const resolved = path.resolve(repo);
    if (!fs.existsSync(resolved)) {
      throw new Error(
        `meta.repoPath does not exist: ${resolved}\n` +
        `  Fix the path in the assessment, or pass --out to write elsewhere.`
      );
    }
    return { dir: path.join(resolved, 'architecture-review'), inRepo: true };
  }
  return { dir: path.join(ROOT, 'output'), inRepo: false };
}

export async function generate(inputPath, opts = {}) {
  const wantDocx = Boolean(opts.docx);
  const a = JSON.parse(fs.readFileSync(inputPath, 'utf8'));
  const branding = JSON.parse(fs.readFileSync(path.join(ROOT, 'config', 'branding.json'), 'utf8'));
  const { dir: outDir, inRepo } = resolveOutDir(a.meta, opts);

  const { errors, warnings, derived: d } = validate(a);
  for (const w of warnings) console.warn(`  warn  ${w}`);
  if (errors.length) {
    for (const e of errors) console.error(`  ERROR ${e}`);
    throw new Error(`${errors.length} validation error(s) — nothing generated.`);
  }

  fs.mkdirSync(outDir, { recursive: true });
  const chartDir = path.join(outDir, 'charts');
  fs.mkdirSync(chartDir, { recursive: true });

  // Build every chart once; both HTML (inline SVG) and DOCX (PNG) consume these.
  const svgs = {
    gauges: charts.gaugeRow(d.dimensions),
    radar: charts.maturityRadar(d.dimensions),
    bars: charts.dimensionBars(d.dimensions),
    donut: charts.priorityDonut(d.counts),
    effort: charts.effortBars(
      d.phases.map((p) => ({ name: `Phase ${p.number}`, sub: p.name.split(/\s*[&—]\s*/)[0], days: p.days }))
    ),
    ...(d.heatmap.rows.length ? { heatmap: charts.riskHeatmap(d.heatmap) } : {}),
    ...(d.layerPriority.length ? { layerPriority: charts.layerPriorityBars(d.layerPriority) } : {}),
  };

  // The HTML reports inline the SVG directly. Standalone SVG copies are written so the
  // charts can be dropped into slides or other documents.
  for (const [name, svg] of Object.entries(svgs)) {
    fs.writeFileSync(path.join(chartDir, `${a.meta.app}-${name}.svg`), svg);
  }

  const slug = a.meta.app;
  const written = [];
  const wantBrief = Boolean(opts.brief);
  const briefName = `DECISION-BRIEF-${slug}.html`;
  const reviewName = `ARCHITECTURE-REVIEW-${slug}.html`;
  // The client dashboard is always written beside the report (see below), scoped
  // to this assessment's client, so the link is never dead and never shows
  // another client's applications.
  const nav =
    `<a href="./${reviewName}">Architecture review</a>` +
    (wantBrief ? `<a href="./${briefName}">Decision brief</a>` : '') +
    `<a href="./${DASHBOARD_NAME}">Client dashboard</a>`;

  // The architecture review is the deliverable and is a superset of the brief.
  const review = renderArchitectureReview(a, d, branding, { navHtml: nav });
  fs.writeFileSync(path.join(outDir, reviewName), review);
  written.push(reviewName);

  // Ship the source assessment beside the report so the repo carries the whole
  // record — the report, the charts, and the contract they were generated from.
  // The canonical copy stays in assessments/, which is what the portfolio reads.
  if (inRepo) {
    const jsonName = path.basename(inputPath);
    fs.writeFileSync(path.join(outDir, jsonName), JSON.stringify(a, null, 2) + '\n');
    written.push(jsonName);
  }

  // Client dashboard: every assessment in assessments/ that shares this client, and
  // nothing from any other client, rendered into the same folder as the report.
  // Skipped when the assessment carries no client name.
  if (a.meta.client) {
    try {
      buildClientDashboard({ client: a.meta.client, out: outDir, branding });
      written.push(DASHBOARD_NAME);
    } catch (err) {
      console.warn(`  warn  client dashboard not written: ${err.message}`);
    }
  }

  // Optional condensed client-facing report. Off by default.
  if (wantBrief) {
    const { renderDecisionBrief } = await import('./decision-brief.mjs');
    fs.writeFileSync(path.join(outDir, briefName), renderDecisionBrief(a, d, branding, { navHtml: nav }));
    written.push(briefName);
  }

  // Optional Word deliverable. Off by default — HTML is the primary format.
  if (wantDocx) {
    const [{ default: sharp }, { buildDocx }] = await Promise.all([import('sharp'), import('./docx.mjs')]);
    const images = {};
    for (const [name, svg] of Object.entries(svgs)) {
      images[name] = await raster(svg, sharp);
      fs.writeFileSync(path.join(chartDir, `${a.meta.app}-${name}.png`), images[name].png);
    }
    const docxName = `${(a.meta.productName || slug).replace(/[^\w.-]+/g, '_')}_Assessment_Report.docx`;
    fs.writeFileSync(path.join(outDir, docxName), await buildDocx(a, d, branding, images));
    written.push(docxName);
  }

  return { written, outDir, derived: d, warnings };
}

// CLI entry
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const args = parseArgs(process.argv);
  if (!args.input) {
    console.error('Usage: node tools/report.mjs --input <assessment.json> [--out <dir>] [--brief] [--docx]');
    console.error('  Writes ARCHITECTURE-REVIEW-<app>.html by default — the complete report.');
    console.error('  Output goes to <meta.repoPath>/architecture-review when the assessment');
    console.error('  names a repo, otherwise to output/. --out overrides both.');
    console.error('  --brief  additionally emit the condensed client-facing DECISION-BRIEF (a subset).');
    console.error('  --docx   additionally emit the Word deliverable.');
    process.exit(1);
  }
  try {
    const { written, outDir, derived, warnings } = await generate(path.resolve(args.input), args);
    console.log(`\n  ${derived.total} findings · ${derived.phases.length} phases · ~${derived.totalDays} man-days · overall ${derived.overall.toFixed(1)}/5`);
    if (warnings.length) console.log(`  ${warnings.length} warning(s) above.`);
    console.log(`\n  Written to ${outDir}:`);
    for (const f of written) console.log(`    ${f}`);
    console.log('');
  } catch (err) {
    console.error(`\n${err.message}\n`);
    process.exit(1);
  }
}
