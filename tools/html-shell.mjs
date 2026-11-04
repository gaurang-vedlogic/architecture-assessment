// Shared HTML shell: one stylesheet, print-friendly, self-contained (no external requests).
import { color, font } from './theme.mjs';

export const esc = (s) =>
  String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Escape, then render `backticked` spans as <code>. Use for short inline prose. */
export const rich = (s) => esc(s).replace(/`([^`]+)`/g, '<code>$1</code>');

/**
 * Block content from the assessment. Handles the point-first style:
 * lines beginning "- " become list items, blank lines separate paragraphs,
 * and a line ending ":" immediately before a list becomes its lead-in.
 */
export function block(s) {
  if (!s) return '';
  const lines = String(s).split('\n');
  let out = '';
  let list = [];
  let para = [];
  const flushList = () => {
    if (list.length) out += `<ul class="tight">${list.map((x) => `<li>${rich(x)}</li>`).join('')}</ul>`;
    list = [];
  };
  const flushPara = () => {
    if (para.length) out += `<p>${rich(para.join(' '))}</p>`;
    para = [];
  };
  for (const raw of lines) {
    const line = raw.trim();
    if (/^[-*]\s+/.test(line)) {
      flushPara();
      list.push(line.replace(/^[-*]\s+/, ''));
    } else if (!line) {
      flushList();
      flushPara();
    } else {
      flushList();
      para.push(line);
    }
  }
  flushList();
  flushPara();
  return out;
}

export const css = `
*,*::before,*::after{box-sizing:border-box}
body{margin:0;background:${color.wash};color:${color.ink};
  font:15px/1.62 ${font.sans};-webkit-font-smoothing:antialiased}
.page{max-width:1180px;margin:0 auto;padding:0 28px 90px}
a{color:${color.navySoft}}
code{font:0.88em/1.5 ${font.mono};background:#eef1f6;border:1px solid ${color.line};
  border-radius:4px;padding:1px 5px;word-break:break-word}
pre{font:12.5px/1.55 ${font.mono};background:#f7f9fc;border:1px solid ${color.line};
  border-left:3px solid ${color.navySoft};border-radius:6px;padding:10px 13px;overflow-x:auto;margin:9px 0}

/* Masthead */
header.mast{background:${color.navy};color:#fff;padding:34px 28px 30px;margin-bottom:26px}
header.mast .inner{max-width:1180px;margin:0 auto}
header.mast .kicker{font-size:11.5px;letter-spacing:.14em;text-transform:uppercase;opacity:.72;margin-bottom:9px}
header.mast h1{margin:0;font-size:30px;line-height:1.22;font-weight:700;letter-spacing:-.01em}
header.mast .sub{margin-top:9px;font-size:13.5px;opacity:.8}
header.mast nav{margin-top:16px;font-size:13px}
header.mast nav a{color:#fff;opacity:.82;text-decoration:none;border-bottom:1px solid rgba(255,255,255,.3);margin-right:20px}
header.mast nav a:hover{opacity:1}

/* Sections */
section{background:${color.paper};border:1px solid ${color.line};border-radius:10px;
  padding:26px 30px;margin-bottom:22px}
h2{font-size:20.5px;margin:0 0 16px;color:${color.navy};font-weight:700;letter-spacing:-.01em;
  padding-bottom:11px;border-bottom:2px solid ${color.navy}}
h3{font-size:16px;margin:26px 0 11px;color:${color.navy};font-weight:700}
h3:first-child{margin-top:0}
h4{font-size:14.5px;margin:20px 0 8px;color:${color.ink};font-weight:700}
p{margin:0 0 12px}
section > p:last-child{margin-bottom:0}
.lede{font-size:15.5px;color:${color.inkMuted}}

/* Tables */
table{width:100%;border-collapse:collapse;margin:12px 0;font-size:13.4px}
.scroll{overflow-x:auto;margin:12px 0}
.scroll table{margin:0}
th{background:${color.navy};color:#fff;text-align:left;padding:9px 11px;font-weight:600;
  font-size:12.6px;letter-spacing:.02em;vertical-align:bottom}
td{padding:9px 11px;border-bottom:1px solid ${color.lineSoft};vertical-align:top}
tbody tr:nth-child(even){background:#fbfcfe}
tbody tr:last-child td{border-bottom:none}
td.num{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
tr.total td{font-weight:700;background:${color.wash};border-top:2px solid ${color.line}}
table.kv td:first-child{width:190px;font-weight:600;color:${color.navy};background:#fafbfd}
table.kv th{display:none}

/* Chips */
.chip{display:inline-block;padding:2px 9px;border-radius:11px;font-size:11.5px;
  font-weight:700;white-space:nowrap;letter-spacing:.02em}
.p0{background:#fde7e7;color:${color.p0}}
.p1{background:#fdf0dc;color:#b06800}
.p2{background:#eef1f6;color:#4a5768}
.crit-High{color:${color.high};font-weight:700}
.crit-Medium{color:${color.medium};font-weight:700}
.crit-Low{color:${color.low};font-weight:700}
.gate-blocks{background:#fde7e7;color:${color.p0}}
.gate-warning{background:#fdf0dc;color:#b06800}
.gate-clear{background:#e4f4ee;color:${color.good}}
.conf{font-size:11.5px;color:${color.inkMuted};font-weight:600}

/* Stat band */
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:14px;margin:4px 0 20px}
.stat{background:${color.wash};border:1px solid ${color.line};border-left:3px solid ${color.navy};
  border-radius:8px;padding:14px 16px}
.stat .v{font-size:27px;font-weight:700;color:${color.navy};line-height:1.1;letter-spacing:-.02em}
.stat .l{font-size:12.4px;font-weight:600;color:${color.ink};margin-top:5px}
.stat .d{font-size:11.6px;color:${color.inkMuted};margin-top:2px}

/* Verdict banner */
.verdict{border-radius:10px;padding:20px 24px;margin-bottom:22px;border:1px solid}
.verdict h2{border:none;padding:0;margin:0 0 8px;font-size:19px;color:inherit}
.verdict .env{font-size:13.5px;font-weight:700;margin-bottom:10px}
.verdict p{margin:0 0 10px;font-size:14px}
.verdict ul{margin:8px 0 0;padding-left:20px;font-size:13.6px}
.verdict li{margin-bottom:6px}
.v-block{background:#fdf2f2;border-color:#f3c4c4;color:#7f1d1d}
.v-cond{background:#fdf8ee;border-color:#f0dcb4;color:#7c4a03}
.v-ok{background:#f0f9f5;border-color:#bfe3d4;color:#0d5c46}

/* Charts */
figure{margin:18px 0;text-align:center}
figure svg{max-width:100%;height:auto}
figcaption{font-size:12.2px;color:${color.inkMuted};margin-top:7px}

/* Findings */
.finding{border:1px solid ${color.line};border-left:4px solid ${color.line};border-radius:8px;
  padding:18px 21px;margin-bottom:16px;background:${color.paper}}
.finding.sev-High{border-left-color:${color.high}}
.finding.sev-Medium{border-left-color:${color.medium}}
.finding.sev-Low{border-left-color:${color.low}}
.finding h4{margin:0 0 4px;font-size:15.5px;color:${color.navy}}
.finding .meta{font-size:12px;color:${color.inkMuted};margin-bottom:12px;display:flex;
  flex-wrap:wrap;gap:8px;align-items:center}
.finding dl{margin:0;display:grid;grid-template-columns:118px 1fr;gap:6px 14px;font-size:13.6px}
.finding dt{font-weight:700;color:${color.navy};font-size:12.4px;padding-top:1px}
.finding dd{margin:0}
.finding dd pre{margin:5px 0 0}
.ev{font:12.4px/1.5 ${font.mono};color:${color.inkMuted}}

/* Invariants + lists */
.inv{list-style:none;padding:0;margin:12px 0;font-size:13.8px}
.inv li{padding:8px 0 8px 84px;border-bottom:1px solid ${color.lineSoft};position:relative}
.inv li:last-child{border-bottom:none}
.inv .tag{position:absolute;left:0;top:8px;font-size:11px;font-weight:700;letter-spacing:.04em;
  padding:2px 7px;border-radius:4px}
.HOLDS{background:#e4f4ee;color:${color.good}}
.VIOLATED{background:#fde7e7;color:${color.p0}}
.CHECK{background:#fdf0dc;color:#b06800}
ul.plain{padding-left:20px;margin:10px 0;font-size:13.8px}
ul.plain li{margin-bottom:7px}
ul.tight{padding-left:19px;margin:8px 0}
ul.tight li{margin-bottom:5px}
ul.tight li:last-child{margin-bottom:0}
.gap-missing{background:#fde7e7;color:#b91c1c}
.gap-partial{background:#fdf0dc;color:#b06800}
.refuted{font-size:13.7px;margin:0 0 11px;padding-left:15px;border-left:2px solid ${color.lineSoft}}
.refuted b{color:${color.navy}}

/* Status glyphs */
.st{font-weight:700;font-size:15px}
.st-good{color:${color.good}}
.st-partial{color:${color.partial}}
.st-absent{color:${color.absent}}

/* TOC */
.toc{columns:2;column-gap:36px;font-size:13.6px;margin:0;padding-left:20px}
.toc li{margin-bottom:5px;break-inside:avoid}

footer{max-width:1180px;margin:0 auto;padding:26px 28px 44px;font-size:12.2px;
  color:${color.inkMuted};text-align:center}

@media (max-width:760px){
  .page{padding:0 14px 60px}
  section{padding:20px 16px}
  .toc{columns:1}
  .finding dl{grid-template-columns:1fr;gap:2px}
  .finding dt{margin-top:8px}
}
@media print{
  body{background:#fff}
  .page{max-width:none;padding:0}
  section{border:none;border-radius:0;padding:0 0 18px;margin-bottom:18px;break-inside:auto}
  h2{break-after:avoid}
  .finding,figure,tr{break-inside:avoid}
  header.mast{background:${color.navy} !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
  th{-webkit-print-color-adjust:exact;print-color-adjust:exact}
  header.mast nav{display:none}
}
`;

export function shell({ title, kicker, subtitle, nav = '', body, footerText }) {
  return `<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(title)}</title>
<style>${css}</style>
</head><body>
<header class="mast"><div class="inner">
${nav ? `<nav>${nav}</nav>` : ''}
<div class="kicker">${esc(kicker)}</div>
<h1>${esc(title)}</h1>
${subtitle ? `<div class="sub">${esc(subtitle)}</div>` : ''}
</div></header>
<div class="page">
${body}
</div>
<footer>${esc(footerText)}</footer>
</body></html>`;
}

/** Build a table from a header array and row arrays. Cells are pre-escaped by the caller. */
export function table(headers, rows, { totalRow = null, scroll = true } = {}) {
  const head = `<thead><tr>${headers.map((h) => `<th>${esc(h)}</th>`).join('')}</tr></thead>`;
  const bodyRows = rows.map((r) => `<tr>${r.map((c) => `<td>${c ?? ''}</td>`).join('')}</tr>`).join('');
  const total = totalRow
    ? `<tr class="total">${totalRow.map((c) => `<td>${c ?? ''}</td>`).join('')}</tr>`
    : '';
  const t = `<table>${head}<tbody>${bodyRows}${total}</tbody></table>`;
  return scroll ? `<div class="scroll">${t}</div>` : t;
}

export const kvTable = (pairs) =>
  `<table class="kv"><tbody>${pairs
    .filter(([, v]) => v != null && v !== '')
    .map(([k, v]) => `<tr><td>${esc(k)}</td><td>${v}</td></tr>`)
    .join('')}</tbody></table>`;

export const chip = (cls, text) => `<span class="chip ${cls}">${esc(text)}</span>`;

export const figure = (svgMarkup, caption) =>
  `<figure>${svgMarkup}${caption ? `<figcaption>${esc(caption)}</figcaption>` : ''}</figure>`;
