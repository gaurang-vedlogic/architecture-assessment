// Review-dashboard.html — roll-up of one client's assessed applications.
// `client` is null only for the internal --all view, which is never shipped.
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { shell, esc, table, chip, figure } from './html-shell.mjs';
import { color, verdictLabel, verdictColor, scoreColor } from './theme.mjs';
import * as charts from './charts.mjs';
import { derive } from './derive.mjs';

const shortVerdict = (v) =>
  ({ APPROVED: 'READY', APPROVE_WITH_CONDITIONS: 'CONDITIONAL', BLOCK_RELEASE: 'BLOCKED' })[v] ?? 'UNRATED';

/**
 * Link from the dashboard to one application's report. Reports live beside the
 * code they describe (`<repoPath>/architecture-review`), so the href is relative
 * to wherever this dashboard is being written — and falls back to a file:// URL
 * when the repo sits on a different drive, where no relative path exists.
 */
function reportHref(meta, outDir) {
  const name = `ARCHITECTURE-REVIEW-${meta.app}.html`;
  if (!meta.repoPath || !outDir) return `./${name}`;
  const target = path.join(path.resolve(meta.repoPath), 'architecture-review', name);
  const rel = path.relative(path.resolve(outDir), target);
  // On Windows, path.relative across drives gives back an absolute path.
  if (path.isAbsolute(rel)) return pathToFileURL(target).href;
  return rel.split(path.sep).join('/');
}

export function renderDashboard(assessments, branding, { generatedOn, outDir, client = null }) {
  const scope = client ? `${client}'s applications` : 'the estate';
  const apps = assessments.map((a) => {
    const d = derive(a);
    const openGates = (a.releaseGates ?? []).filter((g) => g.prod === 'Blocks' && g.status !== 'Pass').length;
    return {
      app: a.meta.app,
      product: a.meta.productName || a.meta.app,
      client: a.meta.client,
      stack: a.meta.stack,
      reviewDate: a.meta.reviewDate,
      verdict: a.verdict?.prod,
      href: reportHref(a.meta, outDir),
      d,
      openGates,
    };
  });

  apps.sort((x, y) => x.d.overall - y.d.overall);

  const totals = apps.reduce(
    (acc, x) => {
      acc.findings += x.d.total;
      acc.P0 += x.d.counts.P0;
      acc.P1 += x.d.counts.P1;
      acc.P2 += x.d.counts.P2;
      acc.days += x.d.totalDays;
      acc.gates += x.openGates;
      return acc;
    },
    { findings: 0, P0: 0, P1: 0, P2: 0, days: 0, gates: 0 }
  );
  const meanMaturity = apps.length
    ? Number((apps.reduce((s, x) => s + x.d.overall, 0) / apps.length).toFixed(1))
    : 0;
  const blocked = apps.filter((x) => x.verdict === 'BLOCK_RELEASE').length;
  const conditional = apps.filter((x) => x.verdict === 'APPROVE_WITH_CONDITIONS').length;
  const ready = apps.filter((x) => x.verdict === 'APPROVED').length;

  let s = '';
  let n = 0;
  const num = () => ++n;

  // ── Estate at a glance ──────────────────────────────────────────────────────
  s += `<section><h2>${num()}. ${client ? 'Portfolio' : 'Estate'} at a Glance</h2>
<div class="stats">
  <div class="stat"><div class="v">${apps.length}</div><div class="l">Applications</div><div class="d">assessed</div></div>
  <div class="stat"><div class="v">${blocked}</div><div class="l">Blocked</div><div class="d">production release held</div></div>
  <div class="stat"><div class="v">${conditional}</div><div class="l">Conditional</div><div class="d">ships once gates clear</div></div>
  <div class="stat"><div class="v">${ready}</div><div class="l">Cleared</div><div class="d">no open blocking gates</div></div>
  <div class="stat"><div class="v">${meanMaturity.toFixed(1)}</div><div class="l">Mean Maturity</div><div class="d">out of 5</div></div>
  <div class="stat"><div class="v">${totals.findings}</div><div class="l">Open Findings</div><div class="d">P0=${totals.P0} P1=${totals.P1} P2=${totals.P2}</div></div>
  <div class="stat"><div class="v">${Number(totals.days.toFixed(1))}</div><div class="l">Remediation</div><div class="d">man-days across ${esc(scope)}</div></div>
  <div class="stat"><div class="v">${totals.gates}</div><div class="l">Production Gates</div><div class="d">open across ${esc(scope)}</div></div>
</div>
<p class="lede">Verdict scale: <b>Ready</b> · <b>Conditional</b> (ships once gates clear) · <b>Blocked</b>. Findings are graded P0 critical · P1 high · P2 medium/low. “md” means man-days of remediation effort.</p>
</section>`;

  // ── Readiness chart ─────────────────────────────────────────────────────────
  s += `<section><h2>${num()}. Production Readiness</h2>`;
  s += figure(
    charts.portfolioBars(
      apps.map((x) => ({
        app: x.app,
        maturity: x.d.overall,
        verdictShort: `${shortVerdict(x.verdict)}${x.openGates ? ` · ${x.openGates}` : ''}`,
        verdictColor: verdictColor(x.verdict),
      }))
    )
  );
  s += table(
    ['Application', 'Maturity', 'Verdict', 'Open Gates', 'Findings', 'P0', 'Effort', 'Reviewed'],
    apps.map((x) => [
      `<b>${esc(x.product)}</b><br><span class="conf">${esc(x.stack ?? '')}</span>`,
      `<span class="num" style="color:${scoreColor(x.d.overall)};font-weight:700">${x.d.overall.toFixed(1)} / 5</span>`,
      `<span style="color:${verdictColor(x.verdict)};font-weight:700">${esc(x.verdict ? verdictLabel(x.verdict) : '—')}</span>`,
      `<span class="num">${x.openGates || '—'}</span>`,
      `<span class="num">${x.d.total}</span>`,
      `<span class="num">${x.d.counts.P0}</span>`,
      `<span class="num">${x.d.totalDays} md</span>`,
      esc(x.reviewDate),
    ]),
    {
      totalRow: [
        `${apps.length} applications`,
        `<span class="num">${meanMaturity.toFixed(1)} mean</span>`,
        `${blocked} blocked · ${conditional} conditional`,
        `<span class="num">${totals.gates}</span>`,
        `<span class="num">${totals.findings}</span>`,
        `<span class="num">${totals.P0}</span>`,
        `<span class="num">${Number(totals.days.toFixed(1))} md</span>`,
        '',
      ],
    }
  );
  s += `</section>`;

  // ── Maturity by dimension ───────────────────────────────────────────────────
  const dimIds = [...new Set(apps.flatMap((x) => x.d.dimensions.map((dd) => dd.id)))];
  if (dimIds.length) {
    const labelFor = (id) =>
      apps.flatMap((x) => x.d.dimensions).find((dd) => dd.id === id)?.label ?? id;
    s += `<section><h2>${num()}. Maturity by Dimension</h2>
<p class="lede">Where ${esc(scope)} ${client ? 'are' : 'is'} systematically weak. A dimension scoring low in <i>every</i> application is a platform or template problem, not an application problem — fix it upstream.</p>`;
    s += table(
      ['Dimension', ...apps.map((x) => x.app), 'Mean'],
      dimIds.map((id) => {
        const vals = apps.map((x) => x.d.dimensions.find((dd) => dd.id === id)?.current);
        const present = vals.filter((v) => v != null);
        const mean = present.length ? present.reduce((a, b) => a + b, 0) / present.length : 0;
        return [
          `<b>${esc(labelFor(id))}</b>`,
          ...vals.map((v) =>
            v == null
              ? '<span class="conf">—</span>'
              : `<span class="num" style="color:${scoreColor(v)};font-weight:700">${v.toFixed(1)}</span>`
          ),
          `<span class="num" style="color:${scoreColor(mean)};font-weight:700">${mean.toFixed(1)}</span>`,
        ];
      })
    );
    s += `</section>`;
  }

  // ── Capability matrix across the estate ─────────────────────────────────────
  const practices = [...new Set(apps.flatMap((x) => (assessments.find((a) => a.meta.app === x.app)?.capabilities ?? []).map((c) => c.practice)))];
  if (practices.length) {
    const glyph = { good: '✓', partial: '!', absent: '✗' };
    s += `<section><h2>${num()}. Capability Matrix</h2>
<p class="lede"><span class="st st-good">✓</span> good · <span class="st st-partial">!</span> partial or at risk · <span class="st st-absent">✗</span> absent or broken. Rows that are red across the board belong in the shared template.</p>`;
    s += table(
      ['Practice', ...apps.map((x) => x.app)],
      practices.map((p) => [
        `<b>${esc(p)}</b>`,
        ...apps.map((x) => {
          const c = (assessments.find((a) => a.meta.app === x.app)?.capabilities ?? []).find((cc) => cc.practice === p);
          return c
            ? `<span class="st st-${c.status}">${glyph[c.status] ?? '?'}</span>`
            : '<span class="conf">—</span>';
        }),
      ])
    );
    s += `</section>`;
  }

  // ── Production blockers ─────────────────────────────────────────────────────
  const blockers = apps.flatMap((x) => {
    const a = assessments.find((aa) => aa.meta.app === x.app);
    return (a?.verdict?.blockers ?? []).map((b) => ({ app: x.app, ...b, finding: x.d.findingById[b.findingId] }));
  });
  if (blockers.length) {
    s += `<section><h2>${num()}. Production Blockers</h2>
<p>${blockers.length} condition${blockers.length === 1 ? '' : 's'} currently hold production releases across ${esc(scope)}.</p>`;
    s += table(
      ['Application', 'Blocker', 'Finding', 'Priority', 'Effort'],
      blockers.map((b) => [
        `<b>${esc(b.app)}</b>`,
        esc(b.text),
        b.findingId ? `<code>${esc(b.findingId)}</code>` : '—',
        b.finding ? chip(b.finding.priority.toLowerCase(), b.finding.priority) : '—',
        `<span class="num">${b.finding?.effortDays ?? '—'}</span>`,
      ])
    );
    s += `</section>`;
  }

  // ── Cross-app patterns ──────────────────────────────────────────────────────
  const ruleCounts = {};
  for (const a of assessments) {
    for (const f of a.findings ?? []) {
      if (!f.ruleId) continue;
      (ruleCounts[f.ruleId] ??= { rule: f.ruleId, title: f.title, apps: new Set(), days: 0 });
      ruleCounts[f.ruleId].apps.add(a.meta.app);
      ruleCounts[f.ruleId].days += f.effortDays ?? 0;
    }
  }
  const recurring = Object.values(ruleCounts)
    .filter((r) => r.apps.size > 1)
    .sort((x, y) => y.apps.size - x.apps.size);
  if (recurring.length) {
    s += `<section><h2>${num()}. Cross-Application Patterns</h2>
<p class="lede">Rules that fired in more than one application. These are the highest-leverage fixes — solving them once in a shared template or library resolves them everywhere.</p>`;
    s += table(
      ['Rule', 'Finding', 'Applications', 'Combined Effort'],
      recurring.map((r) => [
        `<code>${esc(r.rule)}</code>`,
        esc(r.title),
        `<span class="num">${r.apps.size}</span> — ${esc([...r.apps].join(', '))}`,
        `<span class="num">${Number(r.days.toFixed(1))} md</span>`,
      ])
    );
    s += `</section>`;
  }

  // ── Per-application links ───────────────────────────────────────────────────
  s += `<section><h2>${num()}. Application Reports</h2>`;
  s += table(
    ['Application', 'Client', 'Stack', 'Report'],
    apps.map((x) => [
      `<b>${esc(x.product)}</b>`,
      esc(x.client),
      `<span class="conf">${esc(x.stack ?? '')}</span>`,
      `<a href="${esc(x.href)}">Architecture review</a>`,
    ])
  );
  s += `</section>`;

  return shell({
    title: client ? `${client} — Review Dashboard` : 'Review Dashboard (all clients — internal)',
    kicker: `${branding.shortName} · ${client ? 'Client portfolio' : 'Internal portfolio'}`,
    subtitle: `${apps.length} application${apps.length === 1 ? '' : 's'}  ·  ${blocked} blocked, ${conditional} conditional  ·  updated ${generatedOn}`,
    body: s,
    footerText: `${branding.footerText} · ${generatedOn}`,
  });
}
