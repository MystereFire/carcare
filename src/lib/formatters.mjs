export const euroFormatter = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const numberFormatter = new Intl.NumberFormat('fr-FR', {
  maximumFractionDigits: 2,
});

const fixedNumberFormatter = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const dateFormatter = new Intl.DateTimeFormat('fr-FR');

export function formatDate(value) {
  if (value == null || value === '') return '—';
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? dateFormatter.format(date) : '—';
}

export function formatEuro(value) {
  return value != null && Number.isFinite(Number(value)) ? euroFormatter.format(Number(value)) : '—';
}

export function formatNumber(value) {
  return value != null && Number.isFinite(Number(value)) ? numberFormatter.format(Number(value)) : '—';
}

export function formatCurrency(value) {
  return formatEuro(value);
}

export function formatKm(value) {
  return value != null && Number.isFinite(Number(value)) ? `${Math.round(Number(value)).toLocaleString('fr-FR')} km` : '—';
}

export function formatL100(value) {
  return value != null && Number.isFinite(Number(value)) ? `${fixedNumberFormatter.format(Number(value))} L/100km` : '—';
}

export function computeDomain(values, pad = 0.1) {
  const finiteValues = (values || []).filter(v => v != null && Number.isFinite(Number(v))).map(Number);
  if (!finiteValues.length) return [0, undefined];
  const min = Math.min(...finiteValues);
  const max = Math.max(...finiteValues);
  if (!isFinite(min) || !isFinite(max)) return [0, undefined];
  const range = max - min || max || 1;
  const padding = range * pad;
  return [min - padding, max + padding];
}
