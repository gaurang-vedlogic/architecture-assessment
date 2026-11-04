// DECISION-BRIEF-<app>.html — condensed executive/client-facing report.
//
// OPT-IN ONLY. Not produced by a default run; pass --brief to tools/report.mjs.
// ARCHITECTURE-REVIEW is the deliverable and is a strict superset of this file —
// every section here also exists there. If you are changing report content, change
// architecture-review.mjs first, then decide whether the condensed view needs it too.
// Same section structure as the DOCX output.
import { shell, esc, rich, block, table, kvTable, chip, figure } from './html-shell.mjs';
import { verdictLabel } from './theme.mjs';
import * as charts from './charts.mjs';

const em = '—';
const days = (v) => (v == null ? em : String(v));

const verdictClass = (v) =>
  ({ BLOCK_RELEASE: 'v-block', APPROVE_WITH_CONDITIONS: 'v-cond', APPROVED: 'v-ok' })[v] ?? 'v-cond';

export function renderDecisionBrief(a, d, branding, { navHtml = '' } = {}) {
  const m = a.meta;
  const product = m.productName || m.app;
  let s = '';

  // ── Metadata card ───────────────────────────────────────────────────────────
  s += `<section>${kvTable([
    ['Client', esc(m.client)],
    ['Product / System', esc(product)],
    ['Repository', m.repository ? `<code>${esc(m.repository)}</code>` : ''],
    ['Branch / commit', m.branch ? esc([m.branch, m.commit && `@ ${m.commit}`, m.version && `(${m.version})`].filter(Boolean).join(' ')) : ''],
    ['Organisation', esc(m.org)],
    ['Stack', esc(m.stack)],
    ['Review date', esc(m.reviewDate)],
    ['Assessment type', esc(m.assessmentType || branding.documentTitle)],
    ['Prepared by', esc(m.preparedBy || branding.companyName)],
    ['Prepared for', esc(m.client)],
    ['Catalog version', m.catalogVersion ? `<code>${esc(m.catalogVersion)}</code>` : ''],
    ['Document status', esc(m.documentStatus || branding.documentStatus)],
  ])}</section>`;

  // ── Verdict ─────────────────────────────────────────────────────────────────
  if (a.verdict) {
    const v = a.verdict;
    s += `<div class="verdict ${verdictClass(v.prod)}">
<h2>Verdict</h2>
<div class="env">Production: ${esc(verdictLabel(v.prod))}${v.devTest ? ` &nbsp;·&nbsp; Dev/Test: ${esc(verdictLabel(v.devTest))}` : ''}</div>
${v.summary ? `${block(v.summary)}` : ''}
${
  v.blockers?.length
    ? `<p><b>${v.blockers.length} condition${v.blockers.length === 1 ? '' : 's'} to clear before production:</b></p><ul>${v.blockers
        .map((b) => `<li>${rich(b.text)}${b.findingId ? ` <span class="conf">(${esc(b.findingId)})</span>` : ''}</li>`)
        .join('')}</ul>`
    : ''
}
</div>`;
  }

  // ── 1. Objective ────────────────────────────────────────────────────────────
  s += `<section><h2>1. Objective</h2>`;
  const metrics = a.objective.metrics?.length
    ? a.objective.metrics
    : [
        { value: String(d.layers.length), label: 'Layers Assessed', detail: d.layers.join(' · ') },
        { value: String(d.total), label: 'Total Findings', detail: `P0=${d.counts.P0}  P1=${d.counts.P1}  P2=${d.counts.P2}` },
        { value: String(d.phases.length), label: 'Delivery Phases', detail: d.phases.map((p) => p.name.split(/[ &]/)[0]).join(' · ') },
        { value: String(d.totalDays), label: 'Est. Total Effort', detail: 'Man-days across all phases' },
      ];
  s += `<div class="stats">${metrics
    .map(
      (x) =>
        `<div class="stat"><div class="v">${esc(x.value)}</div><div class="l">${esc(x.label)}</div>${
          x.detail ? `<div class="d">${esc(x.detail)}</div>` : ''
        }</div>`
    )
    .join('')}</div>`;
  s += block(a.objective.narrative);
  if (m.scope) s += `<p class="lede">${rich(m.scope)}</p>`;
  s += `</section>`;

  // ── 2. Executive summary & scorecard ────────────────────────────────────────
  s += `<section><h2>2. Executive Summary &amp; Scorecard</h2>`;
  if (a.executiveSummary) {
    s += a.executiveSummary
      .split(/\n{2,}/)
      .map((p) => block(p))
      .join('');
  }
  s += `<h3>Platform Health Scorecard</h3>`;
  s += table(
    ['Dimension', 'Rating', 'Maturity', 'Key Gap'],
    d.dimensions.map((x) => [
      `<b>${esc(x.label)}</b>`,
      `<span class="num">${x.current.toFixed(1)} / 5</span>`,
      esc(x.maturity),
      rich(x.keyGap ?? ''),
    ])
  );
  s += `<p class="lede">Overall maturity <b>${d.overall.toFixed(1)} / 5</b>${
    d.targetMean ? ` against a target of ${d.targetMean.toFixed(1)}` : ''
  }.${a.scorecard?.narrative ? ' ' + esc(a.scorecard.narrative) : ''}</p>`;

  s += `<h3>Scorecard Gauges</h3>` + figure(charts.gaugeRow(d.dimensions));
  s += `<h3>Maturity Radar — Current vs. Target</h3>` +
    figure(charts.maturityRadar(d.dimensions), 'Maturity radar — current posture vs. target.');
  s += `<h3>Dimension Maturity Comparison</h3>` + figure(charts.dimensionBars(d.dimensions));
  s += `</section>`;

  // ── Capability snapshot ─────────────────────────────────────────────────────
  if (a.capabilities?.length) {
    s += `<section><h2>Capability Snapshot</h2>
<p class="lede">Per-practice status — <span class="st st-good">✓</span> good · <span class="st st-partial">!</span> partial or at risk · <span class="st st-absent">✗</span> absent or broken.</p>`;
    s += table(
      ['Practice', 'Status', 'Notes'],
      a.capabilities.map((c) => [
        `<b>${esc(c.practice)}</b>`,
        `<span class="st st-${c.status}">${{ good: '✓', partial: '!', absent: '✗' }[c.status] ?? '?'}</span>`,
        rich(c.notes ?? ''),
      ])
    );
    s += `</section>`;
  }

  // ── 3. Findings overview ────────────────────────────────────────────────────
  s += `<section><h2>3. Findings Overview</h2>`;
  s += `<p>${d.total} finding${d.total === 1 ? '' : 's'} — <b>${d.counts.P0} P0</b> (critical), <b>${d.counts.P1} P1</b> (high), <b>${d.counts.P2} P2</b> (medium/low). By criticality: ${d.critCounts.High} High, ${d.critCounts.Medium} Medium, ${d.critCounts.Low} Low. Priority key: P0 = fix first; P1 = fix soon; P2 = scheduled improvement.</p>`;
  s += figure(charts.priorityDonut(d.counts));
  if (d.heatmap.rows.length) s += `<h3>Risk Heatmap</h3>` + figure(charts.riskHeatmap(d.heatmap));
  if (d.layerPriority.length) s += figure(charts.layerPriorityBars(d.layerPriority));

  d.groups.forEach((g, i) => {
    s += `<h3>3.${i + 1} ${esc(g.name)}</h3>`;
    s += table(
      ['Recommendation', 'Crit.', 'Priority', 'Phase', 'Expected Impact', 'Evidence'],
      g.items.map((f) => [
        `<b>${esc(f.title)}</b>${f.id ? ` <span class="conf">(${esc(f.id)})</span>` : ''}`,
        `<span class="crit-${esc(f.criticality)}">${esc(f.criticality)}</span>`,
        chip(f.priority.toLowerCase(), f.priority),
        `Phase ${f.phase}`,
        rich(f.impact),
        f.evidence?.length
          ? `<span class="ev">${esc(f.evidence[0].file)}${f.evidence[0].line ? `:${f.evidence[0].line}` : ''}${
              f.evidence.length > 1 ? ` +${f.evidence.length - 1}` : ''
            }</span>`
          : em,
      ])
    );
  });
  s += `</section>`;

  // ── 4. Estimated time frames ────────────────────────────────────────────────
  s += `<section><h2>4. Estimated Time Frames</h2>`;
  s += `<h3>Effort Summary by Phase</h3>`;
  s += figure(
    charts.effortBars(
      d.phases.map((p) => ({ name: `Phase ${p.number}`, sub: p.name.split(/\s*[&—]\s*/)[0], days: p.days }))
    )
  );
  for (const p of d.phases) {
    s += `<h3>Phase ${p.number} — ${esc(p.name)}</h3>
<p class="lede"><b>Objective:</b> ${rich(p.objective)}<br><b>Tasks:</b> ${p.taskCount} &nbsp;·&nbsp; <b>Estimated total:</b> ~${p.days} man-days</p>`;
    s += table(
      ['Recommendation', 'Layer', 'Priority', 'Est. (Man-Days)', 'Suggested Role'],
      p.allItems.map((f) => [
        `${esc(f.title)}${f.isGap ? ' <span class="chip gap-missing">gap</span>' : ''}`,
        esc(f.layer),
        chip(f.priority.toLowerCase(), f.priority),
        `<span class="num">${days(f.effortDays)}</span>`,
        esc(f.role ?? ''),
      ]),
      { totalRow: [`Total tasks: ${p.taskCount}`, '', '', `<span class="num">${p.days} days</span>`, ''] }
    );
  }
  s += `<p><b>Total estimated effort across all phases: ~${d.totalDays} man-days.</b></p>`;
  s += `</section>`;

  // ── Missing capabilities (target state) ─────────────────────────────────────
  if (d.gapAreas.length) {
    s += `<section><h2>Missing Capabilities &amp; Recommended Additions</h2>
<p class="lede">Capabilities that do not exist in the platform today. These are distinct from the findings above — a finding is a defect in something that exists; these are things to build. Their effort is included in the roadmap totals and marked <span class="chip gap-missing">gap</span> in the phase tables.</p>`;
    for (const area of d.gapAreas) {
      s += `<h3>${esc(area.area)}</h3>`;
      s += table(
        ['Capability', 'Status', 'Why it matters here', 'Recommended', 'Priority', 'Est.'],
        area.items.map((g) => [
          `<b>${esc(g.capability)}</b>`,
          chip(g.status === 'partial' ? 'gap-partial' : 'gap-missing', g.status === 'partial' ? 'Partial' : 'Missing'),
          rich(g.why ?? ''),
          rich(g.recommendation),
          chip(g.priority.toLowerCase(), g.priority),
          `<span class="num">${days(g.effortDays)}</span>`,
        ])
      );
    }
    s += `<p><b>${d.gaps.length} missing capabilit${d.gaps.length === 1 ? 'y' : 'ies'} · ~${d.gapDays} man-days</b>, included in the phase totals above.</p>`;
    s += `</section>`;
  }

  // ── 5. Suggestions ──────────────────────────────────────────────────────────
  if (a.suggestions?.length) {
    s += `<section><h2>5. Suggestions</h2>
<p>In addition to the core architectural improvements, the following suggestions focus on strengthening development practices and long-term maintainability.</p>`;
    s += table(
      ['Suggestion', 'Description', 'Expected Impact'],
      a.suggestions.map((x) => [`<b>${esc(x.suggestion)}</b>`, rich(x.description ?? ''), rich(x.impact)])
    );
    s += `</section>`;
  }

  // ── 6. Architectural recommendation ─────────────────────────────────────────
  if (a.architecturalRecommendations?.length || a.architecturalNarrative) {
    s += `<section><h2>6. Architectural Recommendation</h2>`;
    if (a.architecturalNarrative) s += `${block(a.architecturalNarrative)}`;
    if (a.architecturalRecommendations?.length) {
      s += table(
        ['Aspect', 'Current State', 'Recommended State', 'Recommendation'],
        a.architecturalRecommendations.map((x) => [
          `<b>${esc(x.aspect)}</b>`,
          rich(x.current),
          rich(x.recommended),
          rich(x.recommendation ?? ''),
        ])
      );
    }
    s += `</section>`;
  }

  // ── 7. Looking ahead ────────────────────────────────────────────────────────
  s += `<section><h2>7. ${esc(branding.closingTitle)}</h2>
${block(a.lookingAhead || branding.closingBody)}
<p class="lede"><b>Prepared by</b><br>${esc(m.preparedBy || branding.companyName)}</p>
<p class="lede">${esc(
    branding.confidentialityNotice
      .replace('{{client}}', m.client)
      .replace('{{shortName}}', branding.shortName)
  )}</p>
</section>`;

  return shell({
    title: `Decision Brief — ${product}`,
    kicker: `${m.documentStatus || branding.documentStatus} · ${branding.shortName}`,
    subtitle: [m.repository, m.branch && `${m.branch}${m.commit ? ` @ ${m.commit}` : ''}`, m.reviewDate]
      .filter(Boolean)
      .join('  ·  '),
    nav: navHtml,
    body: s,
    footerText: `${branding.footerText} · ${m.reviewDate}`,
  });
}
