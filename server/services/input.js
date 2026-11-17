function invalid(message) {
  const error = new Error(message);
  error.status = 400;
  throw error;
}

function number(value, field, { min = 0, max = 1e9, integer = false, nullable = true } = {}) {
  if (value === '' || value == null) {
    if (nullable) return null;
    return invalid(`${field} est requis.`);
  }
  if (!['number', 'string'].includes(typeof value) || (typeof value === 'string' && !value.trim())) invalid(`${field} doit être un nombre.`);
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < min || parsed > max || (integer && !Number.isInteger(parsed))) invalid(`${field} est invalide.`);
  return parsed;
}

function date(value, field, { nullable = true } = {}) {
  if (value === '' || value == null) {
    if (nullable) return null;
    return invalid(`${field} est requis.`);
  }
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(T.*)?$/.test(value) || !Number.isFinite(Date.parse(value))) invalid(`${field} est invalide.`);
  const parsed = new Date(value);
  if (parsed.toISOString().slice(0, 10) !== value.slice(0, 10) && !value.includes('T')) invalid(`${field} est invalide.`);
  return parsed;
}

function boolean(value, field) {
  if (value === true || value === 'true' || value === 1 || value === '1') return true;
  if (value === false || value === 'false' || value === 0 || value === '0' || value == null || value === '') return false;
  return invalid(`${field} doit être un booléen.`);
}

function text(value, field, { required = false, max = 255 } = {}) {
  if (value == null) value = '';
  if (typeof value !== 'string' || value.length > max || (required && !value.trim())) invalid(`${field} est invalide.`);
  return value.trim();
}

function pagination(query, defaultLimit = 10) {
  return {
    page: number(query.page ?? 1, 'page', { min: 1, max: 1e6, integer: true, nullable: false }),
    limit: number(query.limit ?? defaultLimit, 'limit', { min: 1, max: 100, integer: true, nullable: false }),
  };
}

function respondError(res, error) {
  const isInputError = ['SequelizeValidationError', 'SequelizeForeignKeyConstraintError'].includes(error.name);
  const status = error.status || (isInputError ? 400 : 500);
  if (status >= 500) console.error(error);
  return res.status(status).json({ error: status >= 500 ? 'Erreur serveur' : error.message });
}

function validId(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

module.exports = { invalid, number, date, boolean, text, pagination, respondError, validId };
