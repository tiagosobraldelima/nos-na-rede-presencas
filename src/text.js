const ACCENT_MAP = {
  Á: 'A',
  À: 'A',
  Â: 'A',
  Ã: 'A',
  Ä: 'A',
  É: 'E',
  È: 'E',
  Ê: 'E',
  Ë: 'E',
  Í: 'I',
  Ì: 'I',
  Î: 'I',
  Ï: 'I',
  Ó: 'O',
  Ò: 'O',
  Ô: 'O',
  Õ: 'O',
  Ö: 'O',
  Ú: 'U',
  Ù: 'U',
  Û: 'U',
  Ü: 'U',
  Ç: 'C',
};

export function removeAccents(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[ÁÀÂÃÄÉÈÊËÍÌÎÏÓÒÔÕÖÚÙÛÜÇ]/g, (char) => ACCENT_MAP[char] ?? char);
}

export function normalizeValue(value) {
  return removeAccents(value).trim().replace(/\s+/g, ' ').toUpperCase();
}

const COLUMN_ALIASES = new Map([
  ['Nº INSCRICAO', 'N INSCRICAO'],
  ['N° INSCRICAO', 'N INSCRICAO'],
  ['N INSCRICAO', 'N INSCRICAO'],
  ['NUM. INSCRICAO', 'N INSCRICAO'],
  ['NUM INSCRICAO', 'N INSCRICAO'],
  ['1º TURNO', 'TURNO 1'],
  ['1° TURNO', 'TURNO 1'],
  ['1O TURNO', 'TURNO 1'],
  ['1 TURNO', 'TURNO 1'],
  ['2º TURNO', 'TURNO 2'],
  ['2° TURNO', 'TURNO 2'],
  ['2O TURNO', 'TURNO 2'],
  ['2 TURNO', 'TURNO 2'],
]);

export function normalizeColumnName(value) {
  const normalized = normalizeValue(value);
  const aliased = COLUMN_ALIASES.get(normalized) ?? normalized;

  return aliased
    .toLowerCase()
    .replace(/\(([^)]*)\)/g, '_$1')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function titleCaseWord(word, wordIndex) {
  return word
    .split(/([\'\u2019])/)
    .map((part, partIndex) => {
      if (part === "'" || part === '\u2019') return part;
      if (partIndex === 0 && part.length === 1) {
        return wordIndex === 0 ? capitalize(part) : part;
      }
      return capitalize(part);
    })
    .join('');
}

export function titleCasePtBr(value) {
  const connectors = new Set(['de', 'da', 'do', 'das', 'dos', 'e', 'em', 'no', 'na', 'nos', 'nas', 'para']);

  return String(value ?? '')
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word, index) => {
      if (index > 0 && connectors.has(word)) return word;

      if (word.includes("'") || word.includes('\u2019')) {
        return titleCaseWord(word, index);
      }

      return word
        .split('-')
        .map((part) => capitalize(part))
        .join('-');
    })
    .join(' ');
}

export function percent(numerator, denominator) {
  if (!denominator) return 0;
  return Math.round((numerator / denominator) * 1000) / 10;
}
