function integer(value, name, fallback, min, max) {
  if (value == null || value === '') return fallback;
  if (!/^\d+$/.test(String(value)) || Number(value) < min || Number(value) > max) throw new Error(`${name} doit être un entier entre ${min} et ${max}.`);
  return Number(value);
}

function publicUrl(value, name, fallback) {
  if (!value?.trim()) return fallback;
  let url;
  try { url = new URL(value.trim()); } catch { throw new Error(`${name} doit être une URL HTTP ou HTTPS valide.`); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== '/') {
    throw new Error(`${name} doit être une origine HTTP ou HTTPS, sans chemin ni identifiants.`);
  }
  return url.origin;
}

function loadRuntimeConfig(env = process.env) {
  const port = integer(env.PORT, 'PORT', 5000, 1, 65535);
  const host = env.HOST?.trim() || '0.0.0.0';
  const trustProxy = integer(env.TRUST_PROXY, 'TRUST_PROXY', 0, 0, 5);
  const apiUrl = publicUrl(env.API_URL, 'API_URL', `http://localhost:${port}`);
  const frontendUrl = publicUrl(env.FRONTEND_URL, 'FRONTEND_URL', apiUrl);
  const googleEnabled = Boolean(env.GOOGLE_CLIENT_ID?.trim() && env.GOOGLE_CLIENT_SECRET?.trim());
  if (Boolean(env.GOOGLE_CLIENT_ID?.trim()) !== Boolean(env.GOOGLE_CLIENT_SECRET?.trim())) throw new Error('GOOGLE_CLIENT_ID et GOOGLE_CLIENT_SECRET doivent être renseignés ensemble.');
  const smtpPort = integer(env.SMTP_PORT, 'SMTP_PORT', 587, 1, 65535);
  if (env.SMTP_SECURE && !['true', 'false'].includes(env.SMTP_SECURE)) throw new Error('SMTP_SECURE doit valoir true ou false.');
  if (env.SMTP_USER && (!env.SMTP_HOST?.trim() || !env.SMTP_PASS)) throw new Error('SMTP_HOST et SMTP_PASS sont requis lorsque SMTP_USER est renseigné.');
  return { port, host, trustProxy, apiUrl, frontendUrl, googleEnabled, smtpPort, smtpSecure: env.SMTP_SECURE === 'true' };
}

module.exports = { loadRuntimeConfig };
