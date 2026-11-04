// Single source of truth for colour, type and spacing across every output.
// Never hardcode a hex anywhere else.

export const color = {
  navy: '#132043',
  navySoft: '#1f3a5f',
  ink: '#20262e',
  inkMuted: '#5b6675',
  inkFaint: '#8a94a3',
  line: '#d7dde5',
  lineSoft: '#eaeef3',
  paper: '#ffffff',
  wash: '#f5f7fa',

  // Priority / severity
  p0: '#dc2626',
  p1: '#dd8500',
  p2: '#6b7a94',

  crit: '#dc2626',
  high: '#dd8500',
  medium: '#e0b040',
  low: '#6b7a94',

  // Status
  good: '#0e9f77',
  partial: '#dd8500',
  absent: '#dc2626',

  teal: '#0e9f77',
  blue: '#2563eb',

  // Heatmap fills
  cellCritical: '#dc2626',
  cellCriticalText: '#ffffff',
  cellHigh: '#fbdcdc',
  cellHighText: '#b91c1c',
  cellMedium: '#fdeec2',
  cellMediumText: '#b06f00',
  cellLow: '#e6efe9',
  cellLowText: '#12735a',
  cellNa: '#f0f2f5',
  cellNaText: '#8a94a3',
};

export const font = {
  sans: "'Segoe UI', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif",
  mono: "'Cascadia Mono', 'JetBrains Mono', Consolas, 'SFMono-Regular', Menlo, monospace",
  // docx uses a plain family name, not a stack
  docx: 'Segoe UI',
  docxMono: 'Consolas',
};

export const maturityLabel = (score) => {
  if (score >= 5) return 'Optimising';
  if (score >= 4) return 'Managed';
  if (score >= 3) return 'Defined';
  if (score >= 2) return 'Developing';
  if (score >= 1) return 'Initial';
  return 'Absent';
};

/** Colour for a 0-5 maturity score, banded to the maturity labels:
 *  Defined and above reads as healthy, Developing as caution, Initial/Absent as risk. */
export const scoreColor = (score) => {
  if (score >= 4) return color.good;
  if (score >= 3) return color.teal;
  if (score >= 2) return color.high;
  return color.crit;
};

export const priorityColor = (p) => ({ P0: color.p0, P1: color.p1, P2: color.p2 })[p] ?? color.p2;

export const criticalityColor = (c) =>
  ({ High: color.high, Medium: color.medium, Low: color.low, Critical: color.crit })[c] ?? color.low;

export const heatCell = (rating) =>
  ({
    Critical: [color.cellCritical, color.cellCriticalText],
    High: [color.cellHigh, color.cellHighText],
    Medium: [color.cellMedium, color.cellMediumText],
    Low: [color.cellLow, color.cellLowText],
  })[rating] ?? [color.cellNa, color.cellNaText];

export const statusGlyph = (s) => ({ good: '✓', partial: '!', absent: '✗' })[s] ?? '?';
export const statusColor = (s) =>
  ({ good: color.good, partial: color.partial, absent: color.absent })[s] ?? color.inkMuted;

export const verdictLabel = (v) =>
  ({
    APPROVED: 'APPROVED',
    APPROVE_WITH_CONDITIONS: 'APPROVE WITH CONDITIONS',
    BLOCK_RELEASE: 'BLOCK RELEASE',
  })[v] ?? v;

export const verdictColor = (v) =>
  ({ APPROVED: color.good, APPROVE_WITH_CONDITIONS: color.high, BLOCK_RELEASE: color.crit })[v] ??
  color.inkMuted;
