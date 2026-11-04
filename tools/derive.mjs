// Everything computed from an assessment.json, in one place, so all renderers agree.
import { maturityLabel } from './theme.mjs';

export const DEFAULT_PHASES = [
  { number: 1, name: 'Stabilisation & Risk Mitigation', objective: 'Eliminate security risk, data-integrity risk, and configuration instability' },
  { number: 2, name: 'Architecture & Scalability', objective: 'Improve modularity, performance, maintainability and scalability' },
  { number: 3, name: 'Optimisation & Governance', objective: 'Code quality, governance, and operational maturity' },
];

export const RISK_COLUMNS = ['Security', 'Performance', 'Scalability', 'Reliability', 'Maintainability'];

/** Map a finding's dimension onto the heatmap's risk columns. */
const DIMENSION_TO_RISK = {
  security: 'Security',
  scalability: 'Scalability',
  data: 'Reliability',
  observability: 'Reliability',
  devops: 'Reliability',
  architecture: 'Maintainability',
  maintainability: 'Maintainability',
  performance: 'Performance',
};

function cellRating(findings) {
  if (!findings.length) return 'n/a';
  const p0 = findings.filter((f) => f.priority === 'P0').length;
  const p1 = findings.filter((f) => f.priority === 'P1').length;
  const p2 = findings.filter((f) => f.priority === 'P2').length;
  if (p0 >= 1) return 'Critical';
  if (p1 >= 2) return 'High';
  if (p1 >= 1 || p2 >= 3) return 'Medium';
  return 'Low';
}

export function derive(a) {
  const findings = a.findings ?? [];
  const dimensions = (a.scorecard?.dimensions ?? []).map((d) => ({
    ...d,
    maturity: d.maturity ?? maturityLabel(d.current),
  }));

  const counts = {
    P0: findings.filter((f) => f.priority === 'P0').length,
    P1: findings.filter((f) => f.priority === 'P1').length,
    P2: findings.filter((f) => f.priority === 'P2').length,
  };
  const total = findings.length;

  const critCounts = {
    High: findings.filter((f) => f.criticality === 'High').length,
    Medium: findings.filter((f) => f.criticality === 'Medium').length,
    Low: findings.filter((f) => f.criticality === 'Low').length,
  };

  // Gaps are recommended additions rather than defects, but they carry effort and
  // belong on the same roadmap. Normalise them into finding-shaped roadmap items.
  const gaps = (a.gaps ?? []).map((g, i) => ({
    ...g,
    id: g.id ?? `G${i + 1}`,
    title: g.capability,
    isGap: true,
    priority: g.priority ?? 'P2',
    phase: g.phase ?? 3,
    layer: g.layer ?? 'Infrastructure',
    role: g.role ?? '',
    impact: g.recommendation,
  }));

  // Phases: use declared metadata, fall back to the standard three, keep only those with work.
  const declared = a.phases?.length ? a.phases : DEFAULT_PHASES;
  const phases = declared
    .map((p) => {
      const items = findings.filter((f) => f.phase === p.number);
      const gapItems = gaps.filter((g) => g.phase === p.number);
      const all = [...items, ...gapItems];
      const days = all.reduce((s, f) => s + (f.effortDays ?? 0), 0);
      return {
        ...p,
        items,
        gapItems,
        allItems: all,
        days: Number(days.toFixed(1)),
        taskCount: all.length,
      };
    })
    .filter((p) => p.taskCount > 0);

  const totalDays = Number(phases.reduce((s, p) => s + p.days, 0).toFixed(1));
  const gapDays = Number(gaps.reduce((s, g) => s + (g.effortDays ?? 0), 0).toFixed(1));

  // Gaps grouped by area for the target-state section.
  const gapAreas = [...new Set(gaps.map((g) => g.area || 'General'))].map((area) => ({
    area,
    items: gaps.filter((g) => (g.area || 'General') === area),
  }));

  // Layers present, in canonical order.
  const layerOrder = ['Frontend', 'Backend', 'Mobile', 'Database', 'Infrastructure', 'Integrations'];
  const layers = layerOrder.filter((l) => findings.some((f) => f.layer === l));

  // Heatmap. A finding lands in the column named by its explicit `riskDimension`,
  // otherwise by the mapping from its scored dimension. Columns with no findings
  // anywhere are dropped rather than rendered as a wall of n/a.
  const riskOf = (f) => f.riskDimension ?? DIMENSION_TO_RISK[(f.dimension ?? '').toLowerCase()];
  const usedColumns = RISK_COLUMNS.filter((col) => findings.some((f) => riskOf(f) === col));
  const heatmap = {
    columns: usedColumns,
    rows: usedColumns.length
      ? layers.map((layer) => ({
          layer,
          cells: usedColumns.map((col) =>
            cellRating(findings.filter((f) => f.layer === layer && riskOf(f) === col))
          ),
        }))
      : [],
  };

  // Findings grouped for the per-section tables. `group` wins; layer is the fallback.
  const groupNames = [...new Set(findings.map((f) => f.group || f.layer))];
  const groups = groupNames.map((name) => ({
    name,
    items: findings.filter((f) => (f.group || f.layer) === name),
  }));

  const layerPriority = layers.map((layer) => ({
    layer,
    P0: findings.filter((f) => f.layer === layer && f.priority === 'P0').length,
    P1: findings.filter((f) => f.layer === layer && f.priority === 'P1').length,
    P2: findings.filter((f) => f.layer === layer && f.priority === 'P2').length,
  }));

  const overall =
    a.scorecard?.overall ??
    (dimensions.length ? Number((dimensions.reduce((s, d) => s + d.current, 0) / dimensions.length).toFixed(1)) : 0);
  const targetMean = dimensions.length
    ? Number((dimensions.reduce((s, d) => s + d.target, 0) / dimensions.length).toFixed(1))
    : 0;

  const blockingGates = (a.releaseGates ?? []).filter((g) => g.prod === 'Blocks' && g.status !== 'Pass');

  return {
    dimensions,
    counts,
    critCounts,
    total,
    gaps,
    gapAreas,
    gapDays,
    phases,
    totalDays,
    layers,
    heatmap,
    groups,
    layerPriority,
    overall,
    targetMean,
    blockingGates,
    findingById: Object.fromEntries(findings.map((f) => [f.id, f])),
  };
}

/** Schema-light validation plus the cross-consistency checks a JSON Schema cannot express. */
export function validate(a) {
  const errors = [];
  const warnings = [];
  const req = (cond, msg) => !cond && errors.push(msg);

  req(a.meta?.app, 'meta.app is required');
  req(a.meta?.client, 'meta.client is required');
  req(a.meta?.reviewDate, 'meta.reviewDate is required');
  req(a.objective?.narrative, 'objective.narrative is required');
  req(Array.isArray(a.scorecard?.dimensions) && a.scorecard.dimensions.length >= 3, 'scorecard.dimensions needs at least 3 entries');
  req(Array.isArray(a.findings), 'findings must be an array');

  const dimIds = new Set((a.scorecard?.dimensions ?? []).map((d) => d.id));
  for (const d of a.scorecard?.dimensions ?? []) {
    if (d.current < 0 || d.current > 5) errors.push(`dimension ${d.id}: current ${d.current} out of range 0-5`);
    if (d.target < d.current) errors.push(`dimension ${d.id}: target ${d.target} is below current ${d.current}`);
    if (d.target >= 5) warnings.push(`dimension ${d.id}: target 5.0 is not a realistic one-cycle goal`);
    if (!d.keyGap) warnings.push(`dimension ${d.id}: no keyGap — the score is not justified`);
  }

  const ids = new Set();
  for (const f of a.findings ?? []) {
    if (ids.has(f.id)) errors.push(`duplicate finding id ${f.id}`);
    ids.add(f.id);
    if (!f.evidence?.length) warnings.push(`${f.id}: no evidence — a finding without a file reference is not defensible`);
    if (f.dimension && !dimIds.has(f.dimension)) errors.push(`${f.id}: dimension "${f.dimension}" is not in the scorecard`);
    if (f.priority === 'P0' && f.phase !== 1) errors.push(`${f.id}: every P0 must be in phase 1 (found phase ${f.phase})`);
    if (f.effortDays != null && f.effortDays > 10) warnings.push(`${f.id}: ${f.effortDays} days — split findings above 10 days`);
    if (f.effortDays == null) warnings.push(`${f.id}: no effort estimate (renders as an em dash)`);
  }

  for (const g of a.releaseGates ?? []) {
    for (const r of g.findingRefs ?? []) {
      if (!ids.has(r)) errors.push(`release gate "${g.gate}" references unknown finding ${r}`);
    }
  }
  for (const b of a.verdict?.blockers ?? []) {
    if (b.findingId && !ids.has(b.findingId)) errors.push(`verdict blocker references unknown finding ${b.findingId}`);
  }
  for (const inv of a.systemModel?.invariants ?? []) {
    if (inv.findingId && !ids.has(inv.findingId)) errors.push(`invariant references unknown finding ${inv.findingId}`);
    if (inv.status === 'VIOLATED' && !inv.findingId) warnings.push(`VIOLATED invariant has no findingId: "${inv.statement}"`);
  }

  const d = derive(a);
  for (const p of d.phases) {
    const declared = (a.phases ?? []).find((x) => x.number === p.number)?.totalDays;
    if (declared != null && Math.abs(declared - p.days) > 0.01) {
      warnings.push(`phase ${p.number}: declared total ${declared} but findings sum to ${p.days}`);
    }
  }
  if (d.total > 0 && d.counts.P0 / d.total > 0.35) {
    warnings.push(`${d.counts.P0}/${d.total} findings are P0 — re-check the priority derivation, P0 is losing meaning`);
  }
  if (d.phases.length && d.totalDays > 0) {
    const p1 = d.phases.find((p) => p.number === 1);
    if (p1 && p1.days / d.totalDays > 0.6) {
      warnings.push(`phase 1 is ${Math.round((p1.days / d.totalDays) * 100)}% of total effort — move non-P0 work out`);
    }
  }
  if (a.verdict && !a.verdict.summary) warnings.push('verdict has no summary paragraph');

  return { errors, warnings, derived: d };
}
