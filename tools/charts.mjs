// SVG chart generation. Pure string building — no dependencies.
// The same SVG is inlined into HTML and rasterised (via sharp) for DOCX.
import { color, font, maturityLabel, scoreColor, priorityColor, heatCell } from './theme.mjs';

const esc = (s) =>
  String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const round = (n, d = 2) => Number(n.toFixed(d));

/** Wrap an SVG body in a root element with a white background. */
function svg(w, h, body, { transparent = false } = {}) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" font-family="${font.sans}">${
    transparent ? '' : `<rect width="${w}" height="${h}" fill="${color.paper}"/>`
  }${body}</svg>`;
}

/** Split a label into at most `max` lines of roughly `width` characters. */
function wrap(text, width, max = 3) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (!cur.length) cur = w;
    else if ((cur + ' ' + w).length <= width) cur += ' ' + w;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  if (lines.length > max) {
    const kept = lines.slice(0, max);
    kept[max - 1] = kept[max - 1].slice(0, width - 1) + '…';
    return kept;
  }
  return lines;
}

const polar = (cx, cy, r, angleDeg) => {
  const a = ((angleDeg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

/** Arc path from startAngle to endAngle (degrees, 0 = 12 o'clock, clockwise). */
function arcPath(cx, cy, r, startAngle, endAngle) {
  const [x0, y0] = polar(cx, cy, r, startAngle);
  const [x1, y1] = polar(cx, cy, r, endAngle);
  const large = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${round(x0)} ${round(y0)} A ${r} ${r} 0 ${large} 1 ${round(x1)} ${round(y1)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. Executive scorecard — a row of donut gauges, one per dimension
// ─────────────────────────────────────────────────────────────────────────────
export function gaugeRow(dimensions, { title = 'Executive Scorecard' } = {}) {
  const n = dimensions.length;
  const cell = 200;
  const w = Math.max(cell * n, 600);
  const h = 300;
  const r = 62;
  const stroke = 20;

  let body = title
    ? `<text x="${w / 2}" y="34" text-anchor="middle" font-size="21" font-weight="700" fill="${color.navy}">${esc(title)}</text>`
    : '';

  dimensions.forEach((d, i) => {
    const cx = cell * i + cell / 2 + (w - cell * n) / 2;
    const cy = 130;
    const frac = Math.max(0, Math.min(1, d.current / 5));
    const c = scoreColor(d.current);
    const label = d.maturity || maturityLabel(d.current);

    body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color.lineSoft}" stroke-width="${stroke}"/>`;
    if (frac > 0.001) {
      // Full circle needs a different construction than an arc.
      body +=
        frac >= 0.999
          ? `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${c}" stroke-width="${stroke}"/>`
          : `<path d="${arcPath(cx, cy, r, 0, frac * 360)}" fill="none" stroke="${c}" stroke-width="${stroke}" stroke-linecap="round"/>`;
    }
    body += `<text x="${cx}" y="${cy + 4}" text-anchor="middle" font-size="27" font-weight="700" fill="${c}">${d.current.toFixed(1)}</text>`;
    body += `<text x="${cx}" y="${cy + 27}" text-anchor="middle" font-size="13" fill="${color.inkFaint}">/5</text>`;

    wrap(d.label, 18, 3).forEach((line, li) => {
      body += `<text x="${cx}" y="${cy + r + 32 + li * 15}" text-anchor="middle" font-size="12.5" font-weight="600" fill="${color.ink}">${esc(line)}</text>`;
    });
    body += `<text x="${cx}" y="${h - 22}" text-anchor="middle" font-size="12" font-weight="700" fill="${c}">${esc(label)}</text>`;
  });

  return svg(w, h, body);
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. Maturity radar — current vs target
// ─────────────────────────────────────────────────────────────────────────────
export function maturityRadar(dimensions, { title = 'Maturity Radar — Current vs. Target' } = {}) {
  const w = 760;
  const h = 620;
  const cx = w / 2;
  const cy = h / 2 + 18;
  const R = 190;
  const n = dimensions.length;
  const step = 360 / n;

  let body = `<text x="${cx}" y="32" text-anchor="middle" font-size="20" font-weight="700" fill="${color.navy}">${esc(title)}</text>`;

  // Rings and scale labels
  for (let ring = 1; ring <= 5; ring++) {
    const rr = (R * ring) / 5;
    const pts = Array.from({ length: n }, (_, i) => polar(cx, cy, rr, i * step))
      .map(([x, y]) => `${round(x)},${round(y)}`)
      .join(' ');
    body += `<polygon points="${pts}" fill="none" stroke="${ring === 5 ? color.line : color.lineSoft}" stroke-width="1"/>`;
    body += `<text x="${cx + 5}" y="${cy - rr + 4}" font-size="11" fill="${color.inkFaint}">${ring}</text>`;
  }

  // Spokes
  for (let i = 0; i < n; i++) {
    const [x, y] = polar(cx, cy, R, i * step);
    body += `<line x1="${cx}" y1="${cy}" x2="${round(x)}" y2="${round(y)}" stroke="${color.lineSoft}" stroke-width="1"/>`;
  }

  const ring = (key, stroke, fill, dash) => {
    const pts = dimensions
      .map((d, i) => polar(cx, cy, (R * Math.max(0, Math.min(5, d[key]))) / 5, i * step))
      .map(([x, y]) => `${round(x)},${round(y)}`)
      .join(' ');
    return `<polygon points="${pts}" fill="${fill}" stroke="${stroke}" stroke-width="2.5"${dash ? ` stroke-dasharray="${dash}"` : ''} stroke-linejoin="round"/>`;
  };

  body += ring('target', color.teal, 'rgba(14,159,119,0.10)', '7 5');
  body += ring('current', color.blue, 'rgba(37,99,235,0.20)', null);

  dimensions.forEach((d, i) => {
    const [x, y] = polar(cx, cy, (R * d.current) / 5, i * step);
    body += `<circle cx="${round(x)}" cy="${round(y)}" r="4.5" fill="${color.paper}" stroke="${color.blue}" stroke-width="2.5"/>`;
  });

  // Axis labels
  dimensions.forEach((d, i) => {
    const angle = i * step;
    const [lx, ly] = polar(cx, cy, R + 30, angle);
    const norm = ((angle % 360) + 360) % 360;
    const anchor = norm < 10 || norm > 350 ? 'middle' : norm < 180 ? 'start' : norm > 180 ? 'end' : 'middle';
    const lines = wrap(d.label, 16, 2);
    lines.forEach((line, li) => {
      body += `<text x="${round(lx)}" y="${round(ly + li * 14 - (lines.length - 1) * 7 + 4)}" text-anchor="${anchor}" font-size="12.5" font-weight="700" fill="${color.navy}">${esc(line)}</text>`;
    });
  });

  // Legend
  const lx = w - 168;
  body += `<rect x="${lx - 12}" y="46" width="164" height="52" rx="6" fill="${color.paper}" stroke="${color.line}"/>`;
  body += `<line x1="${lx}" y1="64" x2="${lx + 26}" y2="64" stroke="${color.teal}" stroke-width="2.5" stroke-dasharray="7 5"/><text x="${lx + 34}" y="68" font-size="12.5" fill="${color.ink}">Target</text>`;
  body += `<line x1="${lx}" y1="84" x2="${lx + 26}" y2="84" stroke="${color.blue}" stroke-width="2.5"/><circle cx="${lx + 13}" cy="84" r="4.5" fill="${color.paper}" stroke="${color.blue}" stroke-width="2.5"/><text x="${lx + 34}" y="88" font-size="12.5" fill="${color.ink}">Current</text>`;

  return svg(w, h, body);
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. Dimension comparison — horizontal bars, current vs target
// ─────────────────────────────────────────────────────────────────────────────
export function dimensionBars(dimensions, { title = 'Dimension Maturity Comparison' } = {}) {
  const rowH = 42;
  const padL = 230;
  const padR = 70;
  const top = 60;
  const w = 860;
  const h = top + dimensions.length * rowH + 40;
  const barW = w - padL - padR;

  let body = `<text x="${w / 2}" y="32" text-anchor="middle" font-size="20" font-weight="700" fill="${color.navy}">${esc(title)}</text>`;

  for (let g = 0; g <= 5; g++) {
    const x = padL + (barW * g) / 5;
    body += `<line x1="${round(x)}" y1="${top - 8}" x2="${round(x)}" y2="${top + dimensions.length * rowH}" stroke="${color.lineSoft}"/>`;
    body += `<text x="${round(x)}" y="${top + dimensions.length * rowH + 20}" text-anchor="middle" font-size="11" fill="${color.inkFaint}">${g}</text>`;
  }

  dimensions.forEach((d, i) => {
    const y = top + i * rowH;
    const c = scoreColor(d.current);
    body += `<text x="${padL - 14}" y="${y + 21}" text-anchor="end" font-size="13" font-weight="600" fill="${color.ink}">${esc(d.label)}</text>`;
    body += `<rect x="${padL}" y="${y + 8}" width="${barW}" height="18" rx="4" fill="${color.wash}"/>`;
    body += `<rect x="${padL}" y="${y + 8}" width="${round((barW * d.current) / 5)}" height="18" rx="4" fill="${c}"/>`;
    const tx = padL + (barW * d.target) / 5;
    body += `<line x1="${round(tx)}" y1="${y + 3}" x2="${round(tx)}" y2="${y + 31}" stroke="${color.teal}" stroke-width="2.5" stroke-dasharray="4 3"/>`;
    body += `<text x="${w - padR + 10}" y="${y + 21}" font-size="13" font-weight="700" fill="${c}">${d.current.toFixed(1)}</text>`;
  });

  body += `<text x="${padL}" y="${h - 8}" font-size="11.5" fill="${color.inkFaint}">Bars: current maturity  ·  dashed marker: target</text>`;
  return svg(w, h, body);
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. Priority distribution donut
// ─────────────────────────────────────────────────────────────────────────────
export function priorityDonut(counts, { title } = {}) {
  const order = ['P0', 'P1', 'P2'];
  const labels = { P0: 'P0 — Critical', P1: 'P1 — High', P2: 'P2 — Medium' };
  const total = order.reduce((s, k) => s + (counts[k] ?? 0), 0);
  const w = 560;
  const h = 420;
  const cx = 200;
  const cy = 215;
  const rOuter = 132;
  const stroke = 62;
  const r = rOuter - stroke / 2;

  let body = `<text x="${w / 2}" y="34" text-anchor="middle" font-size="20" font-weight="700" fill="${color.navy}">${esc(title ?? `Priority Distribution — ${total} Findings`)}</text>`;

  if (total === 0) {
    body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${color.lineSoft}" stroke-width="${stroke}"/>`;
  } else {
    let angle = 0;
    for (const k of order) {
      const v = counts[k] ?? 0;
      if (!v) continue;
      const sweep = (v / total) * 360;
      const gap = total > v ? 1.6 : 0; // small separator, none when a single slice fills the ring
      if (sweep >= 359.9) {
        body += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${priorityColor(k)}" stroke-width="${stroke}"/>`;
      } else {
        body += `<path d="${arcPath(cx, cy, r, angle + gap, angle + sweep - gap)}" fill="none" stroke="${priorityColor(k)}" stroke-width="${stroke}"/>`;
      }
      const [mx, my] = polar(cx, cy, r, angle + sweep / 2);
      if (sweep > 26) {
        body += `<text x="${round(mx)}" y="${round(my + 5)}" text-anchor="middle" font-size="15" font-weight="700" fill="#fff">${Math.round((v / total) * 100)}%</text>`;
      }
      angle += sweep;
    }
  }

  body += `<text x="${cx}" y="${cy + 6}" text-anchor="middle" font-size="40" font-weight="700" fill="${color.navy}">${total}</text>`;
  body += `<text x="${cx}" y="${cy + 30}" text-anchor="middle" font-size="13" fill="${color.inkFaint}">Findings</text>`;

  order.forEach((k, i) => {
    const ly = 160 + i * 34;
    body += `<rect x="400" y="${ly - 12}" width="26" height="14" rx="3" fill="${priorityColor(k)}"/>`;
    body += `<text x="436" y="${ly}" font-size="14" fill="${color.ink}">${esc(labels[k])} (${counts[k] ?? 0})</text>`;
  });

  return svg(w, h, body);
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. Risk heatmap — layers × risk dimensions
// ─────────────────────────────────────────────────────────────────────────────
export function riskHeatmap(matrix, { title = 'Risk Heatmap — Layers × Risk Dimensions' } = {}) {
  const cols = matrix.columns;
  const rows = matrix.rows;
  const padL = 160;
  const cellW = 190;
  const cellH = 82;
  const top = 62;
  const gap = 8;
  const w = padL + cols.length * cellW + 24;
  const h = top + rows.length * cellH + 52;

  let body = `<text x="${w / 2}" y="34" text-anchor="middle" font-size="20" font-weight="700" fill="${color.navy}">${esc(title)}</text>`;

  rows.forEach((row, ri) => {
    const y = top + ri * cellH;
    body += `<text x="${padL - 18}" y="${y + cellH / 2 + 5}" text-anchor="end" font-size="14" font-weight="700" fill="${color.navy}">${esc(row.layer)}</text>`;
    cols.forEach((col, ci) => {
      const x = padL + ci * cellW;
      const rating = row.cells?.[ci] ?? 'n/a';
      const [bg, fg] = heatCell(rating);
      body += `<rect x="${x + gap / 2}" y="${y + gap / 2}" width="${cellW - gap}" height="${cellH - gap}" rx="6" fill="${bg}"/>`;
      body += `<text x="${x + cellW / 2}" y="${y + cellH / 2 + 6}" text-anchor="middle" font-size="15" font-weight="700" fill="${fg}">${esc(rating)}</text>`;
    });
  });

  cols.forEach((col, ci) => {
    body += `<text x="${padL + ci * cellW + cellW / 2}" y="${h - 20}" text-anchor="middle" font-size="14" font-weight="600" fill="${color.navy}">${esc(col)}</text>`;
  });

  return svg(w, h, body);
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. Effort by phase — vertical bars
// ─────────────────────────────────────────────────────────────────────────────
export function effortBars(phases, { title = 'Estimated Delivery Effort by Phase (Man-Days)' } = {}) {
  const total = phases.reduce((s, p) => s + p.days, 0);
  const bars = [...phases.map((p) => ({ ...p })), { name: 'TOTAL', sub: '', days: total, isTotal: true }];
  const w = 820;
  const h = 460;
  const padL = 62;
  const padB = 74;
  const top = 62;
  const plotH = h - top - padB;
  const plotW = w - padL - 34;
  const max = Math.max(1, ...bars.map((b) => b.days)) * 1.18;
  const barW = Math.min(112, (plotW / bars.length) * 0.56);
  const palette = [color.crit, color.high, color.good, color.navy];

  let body = `<text x="${w / 2}" y="34" text-anchor="middle" font-size="20" font-weight="700" fill="${color.navy}">${esc(title)}</text>`;

  const ticks = 5;
  for (let t = 0; t <= ticks; t++) {
    const v = (max / ticks) * t;
    const y = top + plotH - (plotH * v) / max;
    body += `<line x1="${padL}" y1="${round(y)}" x2="${w - 24}" y2="${round(y)}" stroke="${color.lineSoft}" stroke-dasharray="3 4"/>`;
    body += `<text x="${padL - 10}" y="${round(y + 4)}" text-anchor="end" font-size="11.5" fill="${color.inkFaint}">${Math.round(v)}</text>`;
  }
  body += `<line x1="${padL}" y1="${top + plotH}" x2="${w - 24}" y2="${top + plotH}" stroke="${color.line}"/>`;

  bars.forEach((b, i) => {
    const slot = plotW / bars.length;
    const cx = padL + slot * i + slot / 2;
    const bh = (plotH * b.days) / max;
    const y = top + plotH - bh;
    const c = b.isTotal ? color.navy : palette[i % 3];
    body += `<rect x="${round(cx - barW / 2)}" y="${round(y)}" width="${round(barW)}" height="${round(bh)}" rx="3" fill="${c}"/>`;
    body += `<text x="${round(cx)}" y="${round(y - 11)}" text-anchor="middle" font-size="14.5" font-weight="700" fill="${color.navy}">${b.days} days</text>`;
    body += `<text x="${round(cx)}" y="${top + plotH + 24}" text-anchor="middle" font-size="13" fill="${color.ink}">${esc(b.name)}</text>`;
    if (b.sub) {
      body += `<text x="${round(cx)}" y="${top + plotH + 42}" text-anchor="middle" font-size="12" fill="${color.inkMuted}">${esc(b.sub)}</text>`;
    }
  });

  return svg(w, h, body);
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. Findings by layer & priority — stacked bars (portfolio + brief)
// ─────────────────────────────────────────────────────────────────────────────
export function layerPriorityBars(rows, { title = 'Findings by Layer & Priority' } = {}) {
  const w = 780;
  const padL = 190;
  const rowH = 46;
  const top = 66;
  const h = top + rows.length * rowH + 46;
  const plotW = w - padL - 60;
  const max = Math.max(1, ...rows.map((r) => (r.P0 ?? 0) + (r.P1 ?? 0) + (r.P2 ?? 0)));

  let body = `<text x="${w / 2}" y="34" text-anchor="middle" font-size="20" font-weight="700" fill="${color.navy}">${esc(title)}</text>`;

  rows.forEach((r, i) => {
    const y = top + i * rowH;
    body += `<text x="${padL - 16}" y="${y + 24}" text-anchor="end" font-size="13" font-weight="600" fill="${color.ink}">${esc(r.layer)}</text>`;
    let x = padL;
    for (const k of ['P0', 'P1', 'P2']) {
      const v = r[k] ?? 0;
      if (!v) continue;
      const bw = (plotW * v) / max;
      body += `<rect x="${round(x)}" y="${y + 10}" width="${round(bw)}" height="24" fill="${priorityColor(k)}"/>`;
      if (bw > 22) {
        body += `<text x="${round(x + bw / 2)}" y="${y + 27}" text-anchor="middle" font-size="12.5" font-weight="700" fill="#fff">${v}</text>`;
      }
      x += bw;
    }
    const tot = (r.P0 ?? 0) + (r.P1 ?? 0) + (r.P2 ?? 0);
    body += `<text x="${round(x + 10)}" y="${y + 27}" font-size="12.5" font-weight="600" fill="${color.inkMuted}">${tot}</text>`;
  });

  ['P0', 'P1', 'P2'].forEach((k, i) => {
    const lx = padL + i * 90;
    body += `<rect x="${lx}" y="${h - 26}" width="16" height="11" rx="2" fill="${priorityColor(k)}"/>`;
    body += `<text x="${lx + 22}" y="${h - 16}" font-size="12" fill="${color.inkMuted}">${k}</text>`;
  });

  return svg(w, h, body);
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. Portfolio maturity comparison across applications
// ─────────────────────────────────────────────────────────────────────────────
export function portfolioBars(apps, { title = 'Production Readiness Across the Estate' } = {}) {
  const w = 860;
  const padL = 210;
  const rowH = 44;
  const top = 66;
  const h = top + apps.length * rowH + 34;
  const plotW = w - padL - 200;

  let body = `<text x="${w / 2}" y="34" text-anchor="middle" font-size="20" font-weight="700" fill="${color.navy}">${esc(title)}</text>`;

  apps.forEach((a, i) => {
    const y = top + i * rowH;
    const c = scoreColor(a.maturity);
    body += `<text x="${padL - 16}" y="${y + 24}" text-anchor="end" font-size="13.5" font-weight="600" fill="${color.ink}">${esc(a.app)}</text>`;
    body += `<rect x="${padL}" y="${y + 10}" width="${plotW}" height="20" rx="4" fill="${color.wash}"/>`;
    body += `<rect x="${padL}" y="${y + 10}" width="${round((plotW * a.maturity) / 5)}" height="20" rx="4" fill="${c}"/>`;
    body += `<text x="${padL + plotW + 12}" y="${y + 25}" font-size="13" font-weight="700" fill="${c}">${a.maturity.toFixed(1)}/5</text>`;
    body += `<text x="${padL + plotW + 68}" y="${y + 25}" font-size="12.5" font-weight="700" fill="${a.verdictColor}">${esc(a.verdictShort)}</text>`;
  });

  return svg(w, h, body);
}
