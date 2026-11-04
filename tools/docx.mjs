// <Product>_Assessment_Report.docx — the Word version of the architecture review.
//
// OPT-IN ONLY, behind --docx. Mirrors the section structure of
// architecture-review.mjs; keep the two aligned when either changes.
import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, WidthType, AlignmentType,
  HeadingLevel, ImageRun, BorderStyle, ShadingType, PageBreak, Header, Footer, PageNumber,
} from 'docx';
import { color, font, verdictLabel } from './theme.mjs';

const hex = (c) => c.replace('#', '').toUpperCase();
const NAVY = hex(color.navy);
const LINE = hex(color.line);
const WASH = hex(color.wash);
const em = '—';

const NO_BORDER = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
const cellBorders = {
  top: { style: BorderStyle.SINGLE, size: 2, color: LINE },
  bottom: { style: BorderStyle.SINGLE, size: 2, color: LINE },
  left: { style: BorderStyle.SINGLE, size: 2, color: LINE },
  right: { style: BorderStyle.SINGLE, size: 2, color: LINE },
};

const text = (t, o = {}) =>
  new TextRun({ text: String(t ?? ''), font: font.docx, size: o.size ?? 19, bold: o.bold, italics: o.italics, color: o.color ? hex(o.color) : undefined });

const para = (t, o = {}) =>
  new Paragraph({
    alignment: o.align,
    spacing: { after: o.after ?? 120, before: o.before ?? 0, line: 276 },
    children: Array.isArray(t) ? t : [text(t, o)],
  });

/**
 * Markdown-lite inline parsing: **bold** and `code`.
 * The assessment prose is written point-first, so these markers appear throughout
 * and must not reach the page as literal asterisks and backticks.
 */
function mdRuns(s, o = {}) {
  const str = String(s ?? '');
  const runs = [];
  // Bold may wrap code, so bold is matched first and its contents re-parsed.
  // `[^*]` in the bold pattern keeps glob paths such as `src/**/x.ts` literal.
  const re = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let last = 0;
  for (const mt of str.matchAll(re)) {
    if (mt.index > last) runs.push(text(str.slice(last, mt.index), o));
    const tok = mt[0];
    if (tok.startsWith('**')) runs.push(...mdRuns(tok.slice(2, -2), { ...o, bold: true }));
    else runs.push(new TextRun({ text: tok.slice(1, -1), font: font.docxMono, size: o.size ?? 18, bold: o.bold, color: hex(color.ink) }));
    last = mt.index + tok.length;
  }
  if (last < str.length) runs.push(text(str.slice(last), o));
  return runs.length ? runs : [text('', o)];
}

/**
 * Block content: "- " lines become bullets, blank lines separate paragraphs.
 * Mirrors block() in html-shell.mjs so both renderers read the same source text.
 */
function mdBlock(s, o = {}) {
  if (!s) return [];
  const out = [];
  let para_ = [];
  const flush = () => {
    if (para_.length) out.push(para(mdRuns(para_.join(' '), o), { after: o.after ?? 120 }));
    para_ = [];
  };
  for (const raw of String(s).split('\n')) {
    const line = raw.trim();
    if (/^[-*]\s+/.test(line)) {
      flush();
      out.push(
        new Paragraph({
          bullet: { level: 0 },
          spacing: { after: 60, line: 264 },
          children: mdRuns(line.replace(/^[-*]\s+/, ''), o),
        })
      );
    } else if (!line) flush();
    else para_.push(line);
  }
  flush();
  return out;
}

/** Bulleted list from an array of strings. */
const bullets = (items, o = {}) =>
  (items ?? []).map(
    (x) => new Paragraph({ bullet: { level: 0 }, spacing: { after: 60, line: 264 }, children: mdRuns(x, o) })
  );

const h1 = (t) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 320, after: 160 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 12, color: NAVY, space: 4 } },
    children: [new TextRun({ text: t, font: font.docx, size: 28, bold: true, color: NAVY })],
  });

const h2 = (t) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 240, after: 110 },
    children: [new TextRun({ text: t, font: font.docx, size: 23, bold: true, color: NAVY })],
  });

function cell(content, o = {}) {
  // String cells go through mdRuns so `code` and **bold** in the assessment prose
  // render properly rather than reaching the page as literal markers.
  const children = Array.isArray(content)
    ? content
    : [
        new Paragraph({
          alignment: o.align,
          spacing: { after: 0, line: 260 },
          children: mdRuns(content, { size: o.size ?? 17, bold: o.bold, color: o.color }),
        }),
      ];
  return new TableCell({
    children,
    width: o.width ? { size: o.width, type: WidthType.PERCENTAGE } : undefined,
    shading: o.fill ? { type: ShadingType.CLEAR, fill: hex(o.fill), color: 'auto' } : undefined,
    borders: cellBorders,
    margins: { top: 80, bottom: 80, left: 110, right: 110 },
    columnSpan: o.span,
  });
}

function makeTable(headers, rows, { widths, totalRow } = {}) {
  const head = new TableRow({
    tableHeader: true,
    children: headers.map((h, i) =>
      cell(h, { bold: true, color: '#ffffff', fill: color.navy, width: widths?.[i], size: 17 })
    ),
  });
  const body = rows.map(
    (r, ri) =>
      new TableRow({
        children: r.map((c, i) =>
          typeof c === 'object' && c !== null && !Array.isArray(c)
            ? cell(c.text, { ...c, width: widths?.[i], fill: c.fill ?? (ri % 2 ? '#fbfcfe' : undefined) })
            : cell(c, { width: widths?.[i], fill: ri % 2 ? '#fbfcfe' : undefined })
        ),
      })
  );
  const total = totalRow
    ? [new TableRow({ children: totalRow.map((c, i) => cell(c, { bold: true, fill: color.wash, width: widths?.[i] })) })]
    : [];
  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows: [head, ...body, ...total] });
}

const image = (png, w, h) =>
  new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 200 },
    children: [new ImageRun({ data: png, transformation: { width: w, height: h }, type: 'png' })],
  });

/** Scale a rasterised chart to fit the content width (about 640pt). */
function fit(png, natW, natH, max = 640) {
  const scale = Math.min(1, max / natW);
  return image(png, Math.round(natW * scale), Math.round(natH * scale));
}

export async function buildDocx(a, d, branding, images) {
  const m = a.meta;
  const product = m.productName || m.app;
  const body = [];

  // Running section counter, matching architecture-review.mjs so the two documents
  // carry identical section numbers.
  let n = 0;
  const num = () => ++n;

  // ── Title block ─────────────────────────────────────────────────────────────
  body.push(
    new Paragraph({
      spacing: { before: 600, after: 200 },
      alignment: AlignmentType.CENTER,
      shading: { type: ShadingType.CLEAR, fill: NAVY, color: 'auto' },
      children: [new TextRun({ text: branding.documentTitle, font: font.docx, size: 40, bold: true, color: 'FFFFFF' })],
    }),
    para(product, { align: AlignmentType.CENTER, size: 30, bold: true, color: color.navy, after: 320 })
  );

  body.push(
    makeTable(
      ['Field', 'Detail'],
      [
        ['Client', m.client],
        ['Product / System', product],
        m.repository && ['Repository', m.repository],
        m.branch && ['Branch / commit', [m.branch, m.commit && `@ ${m.commit}`, m.version && `(${m.version})`].filter(Boolean).join(' ')],
        m.org && ['Organisation', m.org],
        m.stack && ['Stack', m.stack],
        ['Review date', m.reviewDate],
        ['Assessment type', m.assessmentType || branding.documentTitle],
        ['Prepared by', m.preparedBy || branding.companyName],
        ['Prepared for', m.client],
        ['Document status', m.documentStatus || branding.documentStatus],
      ].filter(Boolean),
      { widths: [26, 74] }
    )
  );

  // ── Verdict ─────────────────────────────────────────────────────────────────
  if (a.verdict) {
    const v = a.verdict;
    body.push(h1('Verdict'));
    body.push(
      para(
        `Production: ${verdictLabel(v.prod)}${v.devTest ? `   ·   Dev/Test: ${verdictLabel(v.devTest)}` : ''}`,
        { bold: true, size: 22, color: v.prod === 'BLOCK_RELEASE' ? color.crit : v.prod === 'APPROVED' ? color.good : color.high }
      )
    );
    if (v.summary) body.push(...mdBlock(v.summary));
    if (v.blockers?.length) {
      body.push(para(`${v.blockers.length} condition${v.blockers.length === 1 ? '' : 's'} to clear before production:`, { bold: true }));
      body.push(...bullets(v.blockers.map((b) => `${b.text}${b.findingId ? ` (${b.findingId})` : ''}`)));
    }
  }

  // ── Objective ───────────────────────────────────────────────────────────────
  body.push(h1(`${num()}. Objective`));
  const metrics = a.objective.metrics?.length
    ? a.objective.metrics
    : [
        { value: String(d.layers.length), label: 'Layers Assessed', detail: d.layers.join(' · ') },
        { value: String(d.total), label: 'Total Findings', detail: `P0=${d.counts.P0}  P1=${d.counts.P1}  P2=${d.counts.P2}` },
        { value: String(d.phases.length), label: 'Delivery Phases', detail: d.phases.map((p) => p.name.split(/[ &]/)[0]).join(' · ') },
        { value: String(d.totalDays), label: 'Est. Total Effort', detail: 'Man-days across all phases' },
      ];
  body.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: metrics.map((x) =>
            cell(
              [
                para(x.value, { size: 32, bold: true, color: color.navy, align: AlignmentType.CENTER, after: 40 }),
                para(x.label, { size: 17, bold: true, align: AlignmentType.CENTER, after: 20 }),
                para(x.detail ?? '', { size: 15, color: color.inkMuted, align: AlignmentType.CENTER, after: 0 }),
              ],
              { fill: color.wash, width: Math.floor(100 / metrics.length) }
            )
          ),
        }),
      ],
    })
  );
  body.push(para('', { after: 160 }));
  body.push(...mdBlock(a.objective.narrative));
  if (m.scope) body.push(para(mdRuns(m.scope, { italics: true, color: color.inkMuted })));

  // ── Executive summary ───────────────────────────────────────────────────────
  body.push(h1(`${num()}. Executive Summary`));
  if (a.executiveSummary) body.push(...mdBlock(a.executiveSummary));

  // ── Scorecard ───────────────────────────────────────────────────────────────
  body.push(h1(`${num()}. Scorecard & Maturity`));
  body.push(
    makeTable(
      ['Dimension', 'Rating', 'Maturity', 'Target', 'Key Observation'],
      d.dimensions.map((x) => [
        { text: x.label, bold: true },
        { text: `${x.current.toFixed(1)} / 5`, align: AlignmentType.CENTER },
        x.maturity,
        { text: x.target.toFixed(1), align: AlignmentType.CENTER },
        x.keyGap ?? '',
      ]),
      { widths: [20, 10, 11, 8, 51] }
    )
  );
  body.push(
    para(
      `Overall maturity ${d.overall.toFixed(1)} / 5 against a target of ${d.targetMean.toFixed(1)}.${
        a.scorecard?.narrative ? ' ' + a.scorecard.narrative : ''
      }`,
      { bold: true, before: 120 }
    )
  );

  if (images.gauges) { body.push(h2('Scorecard Gauges')); body.push(fit(images.gauges.png, images.gauges.w, images.gauges.h)); }
  if (images.radar) { body.push(h2('Maturity Radar — Current vs. Target')); body.push(fit(images.radar.png, images.radar.w, images.radar.h, 430)); }
  if (images.bars) { body.push(h2('Dimension Maturity Comparison')); body.push(fit(images.bars.png, images.bars.w, images.bars.h)); }

  // ── Capability matrix ───────────────────────────────────────────────────────
  if (a.capabilities?.length) {
    body.push(h1(`${num()}. Capability Matrix`));
    body.push(para('Per-practice status: ✓ good · ! partial or at risk · ✗ absent or broken.', { italics: true, color: color.inkMuted }));
    body.push(
      makeTable(
        ['Practice', 'Status', 'Notes'],
        a.capabilities.map((c) => [
          { text: c.practice, bold: true },
          {
            text: { good: '✓', partial: '!', absent: '✗' }[c.status] ?? '?',
            align: AlignmentType.CENTER,
            bold: true,
            color: { good: color.good, partial: color.partial, absent: color.absent }[c.status],
          },
          c.notes ?? '',
        ]),
        { widths: [26, 8, 66] }
      )
    );
  }

  // ── System model & invariants ───────────────────────────────────────────────
  if (a.systemModel) {
    const sm = a.systemModel;
    body.push(new Paragraph({ children: [new PageBreak()] }));
    body.push(h1(`${num()}. System Model & Invariants`));
    if (sm.purpose) { body.push(h2('Purpose & domain')); body.push(...mdBlock(sm.purpose)); }
    if (sm.actors) { body.push(h2('Actors & trust boundaries')); body.push(...mdBlock(sm.actors)); }
    if (sm.dataFlows) { body.push(h2('Key data flows')); body.push(...mdBlock(sm.dataFlows)); }
    if (sm.invariants?.length) {
      const violated = sm.invariants.filter((i) => i.status === 'VIOLATED').length;
      const check = sm.invariants.filter((i) => i.status === 'CHECK').length;
      body.push(h2('Invariants checked'));
      body.push(
        para(
          `${sm.invariants.length} invariants — ${sm.invariants.length - violated - check} hold, ${violated} violated, ${check} needing further verification.`,
          { italics: true, color: color.inkMuted }
        )
      );
      body.push(
        makeTable(
          ['Status', 'Invariant', 'Note'],
          sm.invariants.map((i) => [
            {
              text: i.status,
              bold: true,
              align: AlignmentType.CENTER,
              color: i.status === 'HOLDS' ? color.good : i.status === 'VIOLATED' ? color.p0 : color.high,
            },
            i.statement,
            [i.note, i.findingId && `(${i.findingId})`].filter(Boolean).join(' '),
          ]),
          { widths: [12, 48, 40] }
        )
      );
    }
  }

  // ── Coverage ────────────────────────────────────────────────────────────────
  if (a.coverage) {
    const c = a.coverage;
    body.push(h1(`${num()}. Coverage`));
    if (c.method) body.push(...mdBlock(c.method));
    if (c.size) body.push(para(mdRuns(`Size. ${c.size}`)));
    const list = (title, items) => {
      if (!items?.length) return;
      body.push(h2(title));
      body.push(...bullets(items));
    };
    list('Deep-read', c.deepRead);
    list('Grep-swept', c.grepSwept);
    list('Not read', c.notRead);
    list('Coverage caveats affecting confidence', c.caveats);
  }

  // ── Threat model ────────────────────────────────────────────────────────────
  if (a.threatModel) {
    body.push(h1(`${num()}. Threat Model`));
    body.push(...mdBlock(a.threatModel));
  }

  // ── Findings overview ───────────────────────────────────────────────────────
  body.push(new Paragraph({ children: [new PageBreak()] }));
  const overviewNo = num();
  body.push(h1(`${overviewNo}. Findings Overview`));
  body.push(
    para(
      `${d.total} findings — ${d.counts.P0} P0 (critical), ${d.counts.P1} P1 (high), ${d.counts.P2} P2 (medium/low). By criticality: ${d.critCounts.High} High, ${d.critCounts.Medium} Medium, ${d.critCounts.Low} Low.`
    )
  );
  if (images.donut) body.push(fit(images.donut.png, images.donut.w, images.donut.h, 400));
  if (images.heatmap) { body.push(h2('Risk Heatmap')); body.push(fit(images.heatmap.png, images.heatmap.w, images.heatmap.h)); }
  if (images.layerPriority) body.push(fit(images.layerPriority.png, images.layerPriority.w, images.layerPriority.h));

  const gateText = (f) =>
    ({ 'blocks-prod': 'Blocks prod', 'blocks-all': 'Blocks all', clear: 'Clear' })[f.gate] ?? 'Warning';

  d.groups.forEach((g, i) => {
    body.push(h2(`${overviewNo}.${i + 1}  ${g.name}`));
    body.push(
      makeTable(
        ['Recommendation', 'Crit.', 'Priority', 'Confidence', 'Gate', 'Expected Impact'],
        g.items.map((f) => [
          { text: `${f.title} (${f.id})`, bold: true },
          { text: f.criticality, align: AlignmentType.CENTER },
          { text: f.priority, align: AlignmentType.CENTER, bold: true, color: { P0: color.p0, P1: color.p1, P2: color.p2 }[f.priority] },
          { text: f.confidence ?? em, align: AlignmentType.CENTER },
          { text: gateText(f), align: AlignmentType.CENTER },
          f.impact,
        ]),
        { widths: [26, 8, 8, 13, 11, 34] }
      )
    );
    body.push(para('', { after: 100 }));
  });

  // ── Findings detail ─────────────────────────────────────────────────────────
  body.push(new Paragraph({ children: [new PageBreak()] }));
  body.push(h1(`${num()}. Findings Detail`));
  body.push(para('Full evidence, reasoning and refutation for each finding listed above.', { italics: true, color: color.inkMuted }));

  for (const g of d.groups) {
    body.push(h2(g.name));
    for (const f of g.items) {
      body.push(
        new Paragraph({
          spacing: { before: 220, after: 60 },
          children: mdRuns(`${f.id} — ${f.title}`, { size: 21, bold: true, color: color.navy }),
        })
      );
      const meta = [
        f.priority,
        f.criticality,
        f.confidence,
        f.gate === 'blocks-prod' ? 'Blocks prod' : null,
        f.layer,
        `Phase ${f.phase}`,
        f.ruleId ? `rule ${f.ruleId}` : null,
        f.instances ? `${f.instances} instances` : null,
      ].filter(Boolean);
      body.push(para(meta.join('  ·  '), { size: 16, color: color.inkMuted, after: 100 }));

      const field = (label, value) => {
        if (!value) return;
        body.push(
          para([text(`${label}. `, { bold: true, color: color.navy }), ...mdRuns(value)], { after: 80 })
        );
      };
      field('Claim', f.claim);
      if (f.evidence?.length) {
        body.push(para([text('Evidence. ', { bold: true, color: color.navy })], { after: 40 }));
        body.push(
          ...f.evidence.map(
            (e) =>
              new Paragraph({
                bullet: { level: 0 },
                spacing: { after: 50, line: 264 },
                children: [
                  new TextRun({ text: `${e.file}${e.line ? `:${e.line}` : ''}`, font: font.docxMono, size: 17, color: hex(color.inkMuted) }),
                  ...(e.note ? [text(' — ', { size: 18 }), ...mdRuns(e.note, { size: 18 })] : []),
                ],
              })
          )
        );
      }
      field('Reasoning', f.reasoning);
      field('Reproduction', f.reproduction);
      field('Impact', f.impact);
      field('Refutation', f.refutation);
      field('Remediation', f.remediation);
      field('Rationale', f.rationale);
      body.push(
        para(
          [
            text('Effort. ', { bold: true, color: color.navy }),
            text(`${f.effortDays == null ? em : `${f.effortDays} man-days`}${f.role ? ` · ${f.role}` : ''}`),
          ],
          { after: 140 }
        )
      );
    }
  }

  // ── Release gates ───────────────────────────────────────────────────────────
  if (a.releaseGates?.length) {
    body.push(h1(`${num()}. Release Gates & Conditions`));
    body.push(
      makeTable(
        ['Gate', 'Finding', 'Dev/Test', 'Prod', 'Status'],
        a.releaseGates.map((g) => [
          { text: g.gate, bold: true },
          g.findingRefs?.length ? g.findingRefs.join(', ') : (g.note ?? em),
          { text: g.devTest ?? em, align: AlignmentType.CENTER },
          {
            text: g.prod ?? em,
            align: AlignmentType.CENTER,
            bold: g.prod === 'Blocks',
            color: g.prod === 'Blocks' ? color.p0 : g.prod === 'Warning' ? color.high : color.good,
          },
          { text: g.status, align: AlignmentType.CENTER },
        ]),
        { widths: [34, 22, 13, 13, 18] }
      )
    );
  }

  // ── Refuted candidates ──────────────────────────────────────────────────────
  if (a.refutedCandidates?.length) {
    body.push(h1(`${num()}. Refuted Candidates`));
    body.push(
      para('Candidates raised during the review and disproved. Recorded so the review is falsifiable.', {
        italics: true,
        color: color.inkMuted,
      })
    );
    for (const r of a.refutedCandidates) {
      body.push(
        para(
          [
            ...mdRuns(`“${r.claim}” `, { bold: true }),
            text(`— ${r.verdict ?? 'Refuted'}${r.step ? ` (step ${r.step})` : ''}: `, { color: color.inkMuted }),
            ...mdRuns(r.reasoning),
          ],
          { after: 110 }
        )
      );
    }
  }

  // ── Positive posture ────────────────────────────────────────────────────────
  if (a.positivePosture?.length) {
    body.push(h1(`${num()}. Positive Posture`));
    body.push(
      para('Verified strengths, held to the same evidence standard as the findings.', {
        italics: true,
        color: color.inkMuted,
      })
    );
    for (const p of a.positivePosture) {
      body.push(para([text(`${p.title}. `, { bold: true, color: color.navy }), ...mdRuns(p.detail)], { after: 110 }));
    }
  }

  // ── Inventory ───────────────────────────────────────────────────────────────
  if (a.inventory?.length) {
    body.push(h1(`${num()}. Application Inventory`));
    body.push(
      makeTable(
        ['Item', 'Count / Detail'],
        a.inventory.map((i) => [{ text: i.item, bold: true }, i.value]),
        { widths: [40, 60] }
      )
    );
  }

  // ── Missing capabilities ────────────────────────────────────────────────────
  if (d.gapAreas.length) {
    body.push(new Paragraph({ children: [new PageBreak()] }));
    body.push(h1(`${num()}. Missing Capabilities & Recommended Additions`));
    body.push(
      para(
        'Capabilities absent from the platform today. A finding is a defect in something that exists; these are things that do not exist and are recommended. Effort is included in the roadmap below.',
        { italics: true, color: color.inkMuted }
      )
    );
    for (const area of d.gapAreas) {
      body.push(h2(area.area));
      body.push(
        makeTable(
          ['Capability', 'Status', 'Why it matters here', 'Recommended', 'Pri.', 'Est.'],
          area.items.map((g) => [
            { text: g.capability, bold: true },
            { text: g.status === 'partial' ? 'Partial' : 'Missing', align: AlignmentType.CENTER, color: g.status === 'partial' ? color.high : color.p0 },
            g.why ?? '',
            g.recommendation,
            { text: g.priority, align: AlignmentType.CENTER, bold: true, color: { P0: color.p0, P1: color.p1, P2: color.p2 }[g.priority] },
            { text: g.effortDays == null ? em : String(g.effortDays), align: AlignmentType.CENTER },
          ]),
          { widths: [20, 9, 30, 29, 6, 6] }
        )
      );
      body.push(para('', { after: 100 }));
    }
    body.push(
      para(`${d.gaps.length} missing capabilities · ~${d.gapDays} man-days, included in the phase totals below.`, { bold: true })
    );
  }

  // ── Estimated time frames ───────────────────────────────────────────────────
  body.push(new Paragraph({ children: [new PageBreak()] }));
  body.push(h1(`${num()}. Estimated Time Frames`));
  body.push(h2('Effort Summary by Phase'));
  if (images.effort) body.push(fit(images.effort.png, images.effort.w, images.effort.h));

  for (const p of d.phases) {
    body.push(h2(`Phase ${p.number} — ${p.name}`));
    body.push(para(`Objective: ${p.objective}`, { italics: true, after: 60 }));
    body.push(para(`Tasks: ${p.taskCount}   ·   Estimated total: ~${p.days} man-days`, { bold: true, after: 120 }));
    body.push(
      makeTable(
        ['Recommendation', 'Layer', 'Priority', 'Est. (Man-Days)', 'Suggested Role'],
        p.allItems.map((f) => [
          f.isGap ? `${f.title}   [gap]` : f.title,
          { text: f.layer, align: AlignmentType.CENTER },
          { text: f.priority, align: AlignmentType.CENTER, bold: true, color: { P0: color.p0, P1: color.p1, P2: color.p2 }[f.priority] },
          { text: f.effortDays == null ? em : String(f.effortDays), align: AlignmentType.CENTER },
          f.role ?? '',
        ]),
        {
          widths: [42, 13, 10, 15, 20],
          totalRow: [`Total tasks: ${p.taskCount}`, '', '', `${p.days} days`, ''],
        }
      )
    );
    body.push(para('', { after: 140 }));
  }
  body.push(para(`Total estimated effort across all phases: ~${d.totalDays} man-days.`, { bold: true }));

  // ── 5. Suggestions ──────────────────────────────────────────────────────────
  if (a.suggestions?.length) {
    body.push(h1(`${num()}. Suggestions`));
    body.push(
      para(
        'In addition to the core architectural improvements, the following suggestions focus on strengthening development practices and long-term maintainability.'
      )
    );
    body.push(
      makeTable(
        ['Suggestion', 'Description', 'Expected Impact'],
        a.suggestions.map((x) => [{ text: x.suggestion, bold: true }, x.description ?? '', x.impact]),
        { widths: [26, 40, 34] }
      )
    );
  }

  // ── 6. Architectural recommendation ─────────────────────────────────────────
  if (a.architecturalRecommendations?.length || a.architecturalNarrative) {
    body.push(h1(`${num()}. Architectural Recommendation`));
    if (a.architecturalNarrative) body.push(...mdBlock(a.architecturalNarrative));
    if (a.architecturalRecommendations?.length) {
      body.push(
        makeTable(
          ['Aspect', 'Current State', 'Recommended State', 'Recommendation'],
          a.architecturalRecommendations.map((x) => [
            { text: x.aspect, bold: true },
            x.current,
            x.recommended,
            x.recommendation ?? '',
          ]),
          { widths: [16, 28, 28, 28] }
        )
      );
    }
  }

  // ── Closing ─────────────────────────────────────────────────────────────────
  body.push(h1(`${num()}. ${branding.closingTitle}`));
  body.push(...mdBlock(a.lookingAhead || branding.closingBody));
  body.push(para('Prepared by', { bold: true, before: 200, after: 40 }));
  body.push(para(m.preparedBy || branding.companyName, { size: 22, color: color.navy, bold: true }));
  body.push(
    para(
      branding.confidentialityNotice.replace('{{client}}', m.client).replace('{{shortName}}', branding.shortName),
      { italics: true, size: 16, color: color.inkMuted, before: 240 }
    )
  );

  const doc = new Document({
    creator: m.preparedBy || branding.companyName,
    title: `${branding.documentTitle} — ${product}`,
    description: `Assessment report for ${product}`,
    sections: [
      {
        properties: { page: { margin: { top: 1000, bottom: 1000, left: 900, right: 900 } } },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: LINE, space: 4 } },
                children: [text(`${branding.headerText}  ·  ${product}`, { size: 15, color: color.inkMuted })],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  text(`${branding.footerText}   ·   Page `, { size: 15, color: color.inkMuted }),
                  new TextRun({ children: [PageNumber.CURRENT], font: font.docx, size: 15, color: hex(color.inkMuted) }),
                ],
              }),
            ],
          }),
        },
        children: body,
      },
    ],
  });

  return Packer.toBuffer(doc);
}
