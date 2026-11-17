const { invalid } = require('./input');

// RFC 4180 fields can contain commas, escaped quotes and line breaks.
function parseCsv(source) {
  if (typeof source !== 'string' || source.length > 1e6) invalid('Le contenu CSV est invalide ou trop volumineux.');
  const rows = [];
  let row = [], field = '', quoted = false, closed = false;
  source = source.replace(/^\uFEFF/, '');
  for (let i = 0; i < source.length; i++) {
    const ch = source[i];
    if (quoted) {
      if (ch === '"' && source[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') { quoted = false; closed = true; }
      else field += ch;
    } else if (ch === '"') {
      if (field || closed) invalid('Guillemets CSV invalides.');
      quoted = true;
    } else if (ch === ',' || ch === '\n' || ch === '\r') {
      row.push(field); field = ''; closed = false;
      if (ch !== ',') {
        if (row.some(value => value.trim())) rows.push(row);
        row = [];
        if (ch === '\r' && source[i + 1] === '\n') i++;
      }
    } else {
      if (closed) invalid('Champ CSV invalide après un guillemet.');
      field += ch;
    }
  }
  if (quoted) invalid('Guillemets CSV non fermés.');
  row.push(field);
  if (row.some(value => value.trim())) rows.push(row);
  return rows;
}

function csvCell(value) {
  let str = value == null ? '' : String(value);
  // Prevent spreadsheet formulas in user-controlled text fields.
  if (/^[\s]*[=+@-]/.test(str)) str = `'${str}`;
  return /[",\r\n]/.test(str) ? `"${str.replace(/"/g, '""')}"` : str;
}

module.exports = { parseCsv, csvCell };
