import { SHEET_CSV_URL } from './config.js';
import { normalizeColumnName } from './text.js';

function isEmptyRow(row) {
  return row.every((value) => String(value).trim() === '');
}

export function parseCsv(csvText) {
  const parsedRows = [];
  let currentRow = [];
  let currentValue = '';
  let insideQuotes = false;
  const text = String(csvText ?? '').replace(/^\uFEFF/, '');

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && insideQuotes && next === '"') {
      currentValue += '"';
      index += 1;
    } else if (char === '"') {
      insideQuotes = !insideQuotes;
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (char === '\r' && next === '\n') index += 1;
      currentRow.push(currentValue);
      parsedRows.push(currentRow);
      currentRow = [];
      currentValue = '';
    } else {
      currentValue += char;
    }
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    parsedRows.push(currentRow);
  }

  const rows = parsedRows.filter((row) => !isEmptyRow(row));
  const header = rows.shift() ?? [];

  return rows.map((row) =>
    Object.fromEntries(header.map((column, index) => [column.trim(), String(row[index] ?? '').trim()]))
  );
}

export function normalizeRows(rows) {
  return rows.map((row) => {
    const normalized = {};

    for (const [key, value] of Object.entries(row)) {
      normalized[normalizeColumnName(key)] = value;
    }

    return normalized;
  });
}

export async function fetchSheetRows(fetchImpl = fetch) {
  const separator = SHEET_CSV_URL.includes('?') ? '&' : '?';
  const response = await fetchImpl(`${SHEET_CSV_URL}${separator}cacheBust=${Date.now()}`, { cache: 'no-store' });

  if (!response.ok) {
    throw new Error(`Não foi possível carregar a planilha (${response.status} ${response.statusText}).`);
  }

  return normalizeRows(parseCsv(await response.text()));
}
