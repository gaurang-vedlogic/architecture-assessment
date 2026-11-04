// ARCHITECTURE-REVIEW-<app>.html — the deep technical review.
// Everything the decision brief summarises, plus the evidence, the invariants,
// the coverage statement and the refutations.
import { shell, esc, rich, block, table, kvTable, chip, figure } from './html-shell.mjs';
import { verdictLabel } from './theme.mjs';
import * as charts from './charts.mjs';

const em = '—';

const verdictClass = (v) =>
  ({ BLOCK_RELEASE: 'v-block', APPROVE_WITH_CONDITIONS: 'v-cond', APPROVED: 'v-ok' })[v] ?? 'v-cond';

const gateChip = (v) =>
  v === 'Blocks'
    ? chip('gate-blocks', 'Blocks')
    : v === 'Warning'
      ? chip('gate-warning', 'Warning')
      : v === 'Clear'
        ? chip('gate-clear', 'Clear')
        : em;

function evidenceBlock(f) {
  if (!f.evidence?.length) return `<span class="conf">No file evidence recorded.</span>`;
  return f.evidence
    .map((e) => {
      const ref = `<span class="ev">${esc(e.file)}${e.line ? `:${e.line}` : ''}</span>`;
      const note = e.note ? ` — ${rich(e.note)}` : '';
      const snip = e.snippet ? `<pre>${esc(e.snippet)}</pre>` : '';
      return `<div>${ref}${note}${snip}</div>`;
    })
    .join('');
}

function findingCard(f) {
  const rows = [
    ['Claim', f.claim ? rich(f.claim) : null],
    ['Evidence', evidenceBlock(f)],
    ['Reasoning', f.reasoning ? rich(f.reasoning) : null],
    ['Reproduction', f.reproduction ? rich(f.reproduction) : null],
    ['Impact', rich(f.impact)],
    ['Refutation', f.refutation ? rich(f.refutation) : null],
    ['Remediation', f.remediation ? rich(f.remediation) : null],
    ['Sample fix', f.sampleFix ? `<pre>${esc(f.sampleFix)}</pre>` : null],
    ['Effort', `${f.effortDays == null ? em : `${f.effortDays} man-days`}${f.role ? ` · ${esc(f.role)}` : ''}`],
    ['Rationale', f.rationale ? rich(f.rationale) : null],
  ].filter(([, v]) => v);

  const meta = [
    chip(f.priority.toLowerCase(), f.priority),
    `<span class="crit-${esc(f.criticality)}">${esc(f.criticality)}</span>`,
    f.confidence ? `<span class="conf">${esc(f.confidence)}</span>` : '',
    f.gate === 'blocks-prod' ? chip('gate-blocks', 'Blocks prod') : f.gate === 'blocks-all' ? chip('gate-blocks', 'Blocks all') : '',
    `<span class="conf">${esc(f.layer)}${f.dimension ? ` · ${esc(f.dimension)}` : ''} · Phase ${f.phase}</span>`,
    f.ruleId ? `<span class="conf">rule ${esc(f.ruleId)}</span>` : '',
    f.instances ? `<span class="conf">${f.instances} instances</span>` : '',
  ]
    .filter(Boolean)
    .join('');

  return `<div class="finding sev-${esc(f.criticality)}" id="${esc(f.id)}">
<h4>${esc(f.id)} — ${esc(f.title)}</h4>
<div class="meta">${meta}</div>
<dl>${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${v}</dd>`).join('')}</dl>
</div>`;
}

export function renderArchitectureReview(a, d, branding, { navHtml = '' } = {}) {
  const m = a.meta;
  const product = m.productName || m.app;
  const findings = a.findings ?? [];
  let s = '';

  // Running section counter so conditionally-omitted sections never leave a gap
  // in the numbering. Same pattern as tools/dashboard.mjs.
  let n = 0;
  const num = () => ++n;

  // ── Cover: contents + full metadata ─────────────────────────────────────────
  const sections = [
    a.verdict && ['verdict', 'Verdict'],
    ['objective', 'Objective'],
    ['summary', 'Executive Summary'],
    ['scorecard', 'Scorecard & Maturity'],
    a.capabilities?.length && ['capabilities', 'Capability Matrix'],
    a.systemModel && ['system-model', 'System Model & Invariants'],
    a.coverage && ['coverage', 'Coverage'],
    a.threatModel && ['threat-model', 'Threat Model'],
    ['findings-overview', 'Findings Overview'],
    ['findings', 'Findings Detail'],
    a.releaseGates?.length && ['gates', 'Release Gates & Conditions'],
    a.refutedCandidates?.length && ['refuted', 'Refuted Candidates'],
    a.positivePosture?.length && ['positive', 'Positive Posture'],
    a.inventory?.length && ['inventory', 'Application Inventory'],
    a.gaps?.length && ['gaps', 'Missing Capabilities & Recommended Additions'],
    ['actions', 'Estimated Time Frames'],
    a.suggestions?.length && ['suggestions', 'Suggestions'],
    (a.architecturalRecommendations?.length || a.architecturalNarrative) && ['arch-rec', 'Architectural Recommendation'],
    ['closing', branding.closingTitle],
  ].filter(Boolean);

  s += `<section><h2>Contents</h2><ol class="toc">${sections
    .map(([id, label]) => `<li><a href="#${id}">${esc(label)}</a></li>`)
    .join('')}</ol>`;
  s += kvTable([
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
    ['Verdict', a.verdict ? esc(`Prod: ${verdictLabel(a.verdict.prod)}${a.verdict.devTest ? ` · Dev/Test: ${verdictLabel(a.verdict.devTest)}` : ''}`) : ''],
    ['Scope', m.scope ? rich(m.scope) : ''],
  ]);
  s += `</section>`;

  // ── Verdict ─────────────────────────────────────────────────────────────────
  if (a.verdict) {
    const v = a.verdict;
    s += `<div class="verdict ${verdictClass(v.prod)}" id="verdict">
<h2>Verdict</h2>
<div class="env">Production: ${esc(verdictLabel(v.prod))}${v.devTest ? ` &nbsp;·&nbsp; Dev/Test: ${esc(verdictLabel(v.devTest))}` : ''}</div>
${v.summary ? `${block(v.summary)}` : ''}
${
  v.blockers?.length
    ? `<p><b>Conditions to clear before production:</b></p><ul>${v.blockers
        .map((b) => `<li>${rich(b.text)}${b.findingId ? ` <a href="#${esc(b.findingId)}">(${esc(b.findingId)})</a>` : ''}</li>`)
        .join('')}</ul>`
    : ''
}
</div>`;
  }

  // ── Objective ───────────────────────────────────────────────────────────────
  s += `<section id="objective"><h2>${num()}. Objective</h2>`;
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
  s += `</section>`;

  // ── Executive summary ───────────────────────────────────────────────────────
  s += `<section id="summary"><h2>${num()}. Executive Summary</h2>`;
  s += (a.executiveSummary ?? a.objective.narrative)
    .split(/\n{2,}/)
    .map((p) => block(p))
    .join('');
  s += `</section>`;

  // ── Scorecard ───────────────────────────────────────────────────────────────
  s += `<section id="scorecard"><h2>${num()}. Scorecard &amp; Maturity</h2>`;
  s += table(
    ['Dimension', 'Rating', 'Maturity', 'Target', 'Key Observation'],
    d.dimensions.map((x) => [
      `<b>${esc(x.label)}</b>`,
      `<span class="num">${x.current.toFixed(1)} / 5</span>`,
      esc(x.maturity),
      `<span class="num">${x.target.toFixed(1)}</span>`,
      rich(x.keyGap ?? ''),
    ])
  );
  s += `<p class="lede">Overall maturity <b>${d.overall.toFixed(1)} / 5</b> against a target of ${d.targetMean.toFixed(1)}.${
    a.scorecard?.narrative ? ' ' + esc(a.scorecard.narrative) : ''
  }</p>`;
  s += `<h3>Scorecard Gauges</h3>` + figure(charts.gaugeRow(d.dimensions));
  s += `<h3>Maturity Radar — Current vs. Target</h3>` +
    figure(charts.maturityRadar(d.dimensions), 'Maturity radar — current posture vs. target.');
  s += `<h3>Dimension Maturity Comparison</h3>` + figure(charts.dimensionBars(d.dimensions));
  s += `</section>`;

  // ── Capability matrix ───────────────────────────────────────────────────────
  if (a.capabilities?.length) {
    s += `<section id="capabilities"><h2>${num()}. Capability Matrix</h2>
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

  // ── System model & invariants ───────────────────────────────────────────────
  if (a.systemModel) {
    const sm = a.systemModel;
    s += `<section id="system-model"><h2>${num()}. System Model &amp; Invariants</h2>`;
    if (sm.purpose) s += `<h3>Purpose &amp; domain</h3>${block(sm.purpose)}`;
    if (sm.actors) s += `<h3>Actors &amp; trust boundaries</h3>${block(sm.actors)}`;
    if (sm.dataFlows) s += `<h3>Key data flows</h3>${block(sm.dataFlows)}`;
    if (sm.invariants?.length) {
      const violated = sm.invariants.filter((i) => i.status === 'VIOLATED').length;
      const check = sm.invariants.filter((i) => i.status === 'CHECK').length;
      s += `<h3>Invariants checked</h3>
<p class="lede">${sm.invariants.length} invariants — ${sm.invariants.length - violated - check} hold, ${violated} violated, ${check} needing further verification.</p>
<ul class="inv">${sm.invariants
        .map(
          (i) =>
            `<li><span class="tag ${i.status}">${i.status}</span>${rich(i.statement)}${
              i.note ? ` — ${rich(i.note)}` : ''
            }${i.findingId ? ` <a href="#${esc(i.findingId)}">(${esc(i.findingId)})</a>` : ''}</li>`
        )
        .join('')}</ul>`;
    }
    s += `</section>`;
  }

  // ── Coverage ────────────────────────────────────────────────────────────────
  if (a.coverage) {
    const c = a.coverage;
    s += `<section id="coverage"><h2>${num()}. Coverage</h2>`;
    if (c.method) s += `${block(c.method)}`;
    if (c.size) s += `<p><b>Size.</b> ${rich(c.size)}</p>`;
    const list = (title, items) =>
      items?.length ? `<h3>${title}</h3><ul class="plain">${items.map((x) => `<li>${rich(x)}</li>`).join('')}</ul>` : '';
    s += list('Deep-read', c.deepRead);
    s += list('Grep-swept', c.grepSwept);
    s += list('Not read', c.notRead);
    s += list('Coverage caveats affecting confidence', c.caveats);
    s += `</section>`;
  }

  if (a.threatModel) {
    s += `<section id="threat-model"><h2>${num()}. Threat Model</h2>${block(a.threatModel)}</section>`;
  }

  // ── Findings overview (scannable) ───────────────────────────────────────────
  s += `<section id="findings-overview"><h2>${num()}. Findings Overview</h2>`;
  s += `<p>${d.total} finding${d.total === 1 ? '' : 's'} — <b>${d.counts.P0} P0</b> (critical), <b>${d.counts.P1} P1</b> (high), <b>${d.counts.P2} P2</b> (medium/low). By criticality: ${d.critCounts.High} High, ${d.critCounts.Medium} Medium, ${d.critCounts.Low} Low. Priority key: P0 = fix first; P1 = fix soon; P2 = scheduled improvement.</p>`;
  s += figure(charts.priorityDonut(d.counts));
  if (d.heatmap.rows.length) s += `<h3>Risk Heatmap</h3>` + figure(charts.riskHeatmap(d.heatmap));
  if (d.layerPriority.length) s += figure(charts.layerPriorityBars(d.layerPriority));

  // One table per group, carrying everything the old standalone findings index
  // carried plus impact and evidence — so the index is no longer needed and the
  // same findings are not enumerated twice in one document.
  const gateCell = (f) =>
    f.gate === 'blocks-prod'
      ? chip('gate-blocks', 'Blocks prod')
      : f.gate === 'blocks-all'
        ? chip('gate-blocks', 'Blocks all')
        : f.gate === 'clear'
          ? chip('gate-clear', 'Clear')
          : chip('gate-warning', 'Warning');

  d.groups.forEach((g, i) => {
    s += `<h3>${n}.${i + 1} ${esc(g.name)}</h3>`;
    s += table(
      ['Recommendation', 'Crit.', 'Priority', 'Confidence', 'Gate', 'Expected Impact', 'Evidence'],
      g.items.map((f) => [
        `<a href="#${esc(f.id)}"><b>${esc(f.title)}</b></a> <span class="conf">(${esc(f.id)})</span>`,
        `<span class="crit-${esc(f.criticality)}">${esc(f.criticality)}</span>`,
        chip(f.priority.toLowerCase(), f.priority),
        f.confidence ? `<span class="conf">${esc(f.confidence)}</span>` : em,
        gateCell(f),
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

  // ── Findings detail ─────────────────────────────────────────────────────────
  s += `<section id="findings"><h2>${num()}. Findings Detail</h2>`;
  s += `<p class="lede">Full evidence, reasoning and refutation for each finding listed above.</p>`;

  for (const g of d.groups) {
    s += `<h3>${esc(g.name)}</h3>`;
    s += g.items.map(findingCard).join('');
  }
  s += `</section>`;

  // ── Release gates ───────────────────────────────────────────────────────────
  if (a.releaseGates?.length) {
    s += `<section id="gates"><h2>${num()}. Release Gates &amp; Conditions</h2>`;
    s += table(
      ['Gate', 'Finding', 'Dev/Test', 'Prod', 'Status'],
      a.releaseGates.map((g) => [
        `<b>${esc(g.gate)}</b>`,
        g.findingRefs?.length
          ? g.findingRefs.map((r) => `<a href="#${esc(r)}">${esc(r)}</a>`).join(', ')
          : esc(g.note ?? em),
        gateChip(g.devTest),
        gateChip(g.prod),
        esc(g.status),
      ])
    );
    if (d.blockingGates.length) {
      s += `<p><b>${d.blockingGates.length} gate${d.blockingGates.length === 1 ? '' : 's'} currently block production:</b> ${d.blockingGates
        .map((g) => esc(g.gate))
        .join(', ')}.</p>`;
    }
    s += `</section>`;
  }

  // ── Refuted candidates ──────────────────────────────────────────────────────
  if (a.refutedCandidates?.length) {
    s += `<section id="refuted"><h2>${num()}. Refuted Candidates</h2>
<p class="lede">Candidates raised during the review and disproved. Recorded so the review is falsifiable — see <code>METHODOLOGY.md</code>.</p>`;
    s += a.refutedCandidates
      .map(
        (r) =>
          `<p class="refuted"><b>“${esc(r.claim)}”</b> — ${esc(r.verdict ?? 'Refuted')}${
            r.step ? ` (step ${r.step})` : ''
          }: ${rich(r.reasoning)}</p>`
      )
      .join('');
    s += `</section>`;
  }

  // ── Positive posture ────────────────────────────────────────────────────────
  if (a.positivePosture?.length) {
    s += `<section id="positive"><h2>${num()}. Positive Posture</h2>
<p class="lede">Verified strengths, held to the same evidence standard as the findings. These are what to protect during remediation.</p>`;
    s += a.positivePosture.map((p) => `<p><b>${esc(p.title)}.</b> ${rich(p.detail)}</p>`).join('');
    s += `</section>`;
  }

  // ── Inventory ───────────────────────────────────────────────────────────────
  if (a.inventory?.length) {
    s += `<section id="inventory"><h2>${num()}. Application Inventory</h2>`;
    s += table(['Item', 'Count / Detail'], a.inventory.map((i) => [`<b>${esc(i.item)}</b>`, rich(i.value)]));
    s += `</section>`;
  }

  // ── Missing capabilities (target state) ─────────────────────────────────────
  if (d.gapAreas.length) {
    s += `<section id="gaps"><h2>${num()}. Missing Capabilities &amp; Recommended Additions</h2>
<p class="lede">Capabilities absent from the platform today. A finding is a defect in something that exists; these are things that do not exist and are recommended. Effort is included in the roadmap below, marked <span class="chip gap-missing">gap</span>.</p>`;
    for (const area of d.gapAreas) {
      s += `<h3>${esc(area.area)}</h3>`;
      s += table(
        ['Capability', 'Status', 'Why it matters here', 'Recommended', 'Priority', 'Phase', 'Est.'],
        area.items.map((g) => [
          `<b>${esc(g.capability)}</b>`,
          chip(g.status === 'partial' ? 'gap-partial' : 'gap-missing', g.status === 'partial' ? 'Partial' : 'Missing'),
          rich(g.why ?? ''),
          rich(g.recommendation),
          chip(g.priority.toLowerCase(), g.priority),
          `Phase ${g.phase}`,
          `<span class="num">${g.effortDays == null ? em : g.effortDays}</span>`,
        ])
      );
    }
    s += `<p><b>${d.gaps.length} missing capabilit${d.gaps.length === 1 ? 'y' : 'ies'} · ~${d.gapDays} man-days.</b></p></section>`;
  }

  // ── Prioritised actions ─────────────────────────────────────────────────────
  s += `<section id="actions"><h2>${num()}. Estimated Time Frames</h2>`;
  s += figure(
    charts.effortBars(
      d.phases.map((p) => ({ name: `Phase ${p.number}`, sub: p.name.split(/\s*[&—]\s*/)[0], days: p.days }))
    )
  );
  for (const p of d.phases) {
    s += `<h3>Phase ${p.number} — ${esc(p.name)} (${p.taskCount} tasks · ~${p.days} man-days)</h3>
<p class="lede">${rich(p.objective)}</p>`;
    s += table(
      ['Finding', 'Recommendation', 'Layer', 'Priority', 'Est. (Man-Days)', 'Role'],
      p.allItems.map((f) => [
        f.isGap ? `<span class="chip gap-missing">gap</span>` : `<a href="#${esc(f.id)}">${esc(f.id)}</a>`,
        esc(f.remediation ?? f.title),
        esc(f.layer),
        chip(f.priority.toLowerCase(), f.priority),
        `<span class="num">${f.effortDays == null ? em : f.effortDays}</span>`,
        esc(f.role ?? ''),
      ]),
      { totalRow: ['', `Total: ${p.taskCount} tasks`, '', '', `<span class="num">~${p.days}</span>`, ''] }
    );
  }
  s += `<p><b>Total: ~${d.totalDays} man-days across ${d.phases.length} phase${d.phases.length === 1 ? '' : 's'}.</b></p>`;
  s += `</section>`;

  // ── Suggestions ─────────────────────────────────────────────────────────────
  if (a.suggestions?.length) {
    s += `<section id="suggestions"><h2>${num()}. Suggestions</h2>
<p>In addition to the core architectural improvements, the following suggestions focus on strengthening development practices and long-term maintainability.</p>`;
    s += table(
      ['Suggestion', 'Description', 'Expected Impact'],
      a.suggestions.map((x) => [`<b>${esc(x.suggestion)}</b>`, rich(x.description ?? ''), rich(x.impact)])
    );
    s += `</section>`;
  }

  // ── Architectural recommendation ────────────────────────────────────────────
  if (a.architecturalRecommendations?.length || a.architecturalNarrative) {
    s += `<section id="arch-rec"><h2>${num()}. Architectural Recommendation</h2>`;
    if (a.architecturalNarrative) s += block(a.architecturalNarrative);
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

  // ── Closing ─────────────────────────────────────────────────────────────────
  s += `<section id="closing"><h2>${num()}. ${esc(branding.closingTitle)}</h2>`;
  s += block(a.lookingAhead || branding.closingBody);
  s += `<p class="lede"><b>Prepared by</b><br>${esc(m.preparedBy || branding.companyName)}</p>`;
  s += `<p class="lede">${esc(
    branding.confidentialityNotice
      .replace('{{client}}', m.client)
      .replace('{{shortName}}', branding.shortName)
  )}</p>`;
  s += `</section>`;

  return shell({
    title: `Architecture Review — ${product}`,
    kicker: `${m.documentStatus || branding.documentStatus} · ${branding.shortName}`,
    subtitle: [m.repository, m.branch && `${m.branch}${m.commit ? ` @ ${m.commit}` : ''}`, m.reviewDate]
      .filter(Boolean)
      .join('  ·  '),
    nav: navHtml,
    body: s,
    footerText: `${branding.footerText} · ${m.reviewDate}`,
  });
}
