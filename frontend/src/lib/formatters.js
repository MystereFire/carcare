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
  return dateFormatter.format(new Date(value));
}

export function formatEuro(value) {
  return euroFormatter.format(value);
}

export function formatNumber(value) {
  return numberFormatter.format(value);
}

export function formatCurrency(value) {
  return euroFormatter.format(value);
}

export function formatKm(value) {
  return `${Math.round(value).toLocaleString('fr-FR')} km`;
}

export function formatL100(value) {
  return `${fixedNumberFormatter.format(value)} L/100km`;
}

export function computeDomain(values, pad = 0.1) {
  if (!values.length) return [0, undefined];
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!isFinite(min) || !isFinite(max)) return [0, undefined];
  const range = max - min || max || 1;
  const padding = range * pad;
  return [min - padding, max + padding];
}
