// An empty value supports a same-origin reverse proxy in production.
export const API_URL = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

export function vehicleImageUrl(path) {
  if (!path) return '/car-placeholder.svg';
  return /^https?:\/\//i.test(path) ? path : `${API_URL}${path}`;
}
