export const SHEET_CSV_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vQoGnE2RG9yDysuCwJubfxoJcbbdC8yfeguHrKOXwxyiIGAKxy71hvp8Uow4-3gucHLQlBOqp24NdaU/pub?gid=1700106572&single=true&output=csv';

export const TOTAL_ENCOUNTERS = 5;
export const PERIODS_PER_ENCOUNTER = 2;
export const TOTAL_PERIODS = TOTAL_ENCOUNTERS * PERIODS_PER_ENCOUNTER;
export const MIN_VALID_PERIODS = 7;
export const REFRESH_INTERVAL_MS = 60_000;

export const CERTIFICATION_STATUS = {
  apto: 'Apto pelo critério de frequência',
  acompanhamento: 'Em acompanhamento',
  naoApto: 'Não apto pelo critério de frequência'
};

export const PERIOD_STATUS = {
  presente: 'PRESENTE',
  ausente: 'AUSENTE',
  dispensado: 'DISPENSADO',
  atestado: 'ATESTADO MÉDICO',
  semRegistro: 'SEM REGISTRO'
};

export const COLORS = {
  ink: '#1a1a1a',
  muted: '#5f646d',
  blue: '#2f80c1',
  cyan: '#33a6d9',
  pink: '#ed4f9a',
  yellow: '#f2cf43',
  red: '#e94b3c',
  green: '#78bd43',
  card: '#fbfbfb',
  line: '#d8dde5'
};
