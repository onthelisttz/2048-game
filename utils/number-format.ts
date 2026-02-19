const fullNumberFormatter = new Intl.NumberFormat('en-US');
const compactNumberFormatter = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  compactDisplay: 'short',
  maximumFractionDigits: 1,
});

export function formatNumber(value: number): string {
  return fullNumberFormatter.format(Math.trunc(value));
}

export function formatCompactNumber(value: number, threshold = 10_000): string {
  const safeValue = Math.trunc(value);
  if (Math.abs(safeValue) < threshold) return fullNumberFormatter.format(safeValue);
  return compactNumberFormatter.format(safeValue);
}

