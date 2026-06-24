import {
  CERTIFICATION_STATUS,
  MIN_VALID_PERIODS,
  PERIODS_PER_ENCOUNTER,
  TOTAL_ENCOUNTERS,
  TOTAL_PERIODS
} from './config.js';
import { normalizeValue, percent, titleCasePtBr } from './text.js';

function encounterNumber(rawValue) {
  const match = String(rawValue ?? '').match(/\d+/);
  return match ? Number(match[0]) : 0;
}

function studentKey(row) {
  const cpf = String(row.cpf ?? '').trim();
  const inscricao = String(row.n_inscricao ?? '').trim();
  if (cpf || inscricao) return `${cpf}::${inscricao}`;

  return [
    row.nome ?? '',
    row.email ?? '',
    row.turma ?? '',
    row.municipio ?? ''
  ].map((value) => normalizeValue(value)).join('::');
}

function classifyPeriod(rawStatus, encounter, hasRow) {
  const value = normalizeValue(rawStatus);
  if (value === 'PRESENTE') return 'presente';
  if (value === 'AUSENTE') return 'ausente';
  if (value === 'DISPENSADO') return 'dispensado';
  if (value === 'ATESTADO MEDICO') return 'atestado';
  if (encounter === 1 && (!hasRow || value === '')) return 'dispensaAutomatica';
  return 'semRegistro';
}

function createStudent(row) {
  return {
    id: studentKey(row),
    nome: titleCasePtBr(row.nome),
    cpf: String(row.cpf ?? '').trim(),
    inscricao: String(row.n_inscricao ?? '').trim(),
    statusInscricao: normalizeValue(row.status_da_inscricao || 'INSCRITO'),
    municipio: titleCasePtBr(row.municipio || 'Não informado'),
    turma: String(row.turma || 'Não informada').trim(),
    email: String(row.email ?? '').trim(),
    educador: titleCasePtBr(row.educador_a || 'Não informado'),
    encontros: new Map()
  };
}

function addEncounter(student, row) {
  const encontro = encounterNumber(row.n_encontro);
  if (!encontro || encontro > TOTAL_ENCOUNTERS) return;

  student.encontros.set(encontro, {
    encontro,
    data: String(row.data_do_encontro ?? '').trim(),
    turno1: row.turno_1 ?? '',
    turno2: row.turno_2 ?? '',
    observacoes: String(row.observacoes ?? '').trim()
  });
}

function finalizeStudent(student, launchedEncounters) {
  const counts = {
    presencas: 0,
    faltas: 0,
    dispensasExplicitas: 0,
    atestados: 0,
    dispensasAutomaticas: 0,
    semRegistro: 0
  };
  const periods = [];

  for (let encontro = 1; encontro <= TOTAL_ENCOUNTERS; encontro += 1) {
    const record = student.encontros.get(encontro);
    const statuses = record ? [record.turno1, record.turno2] : ['', ''];

    for (let periodo = 1; periodo <= PERIODS_PER_ENCOUNTER; periodo += 1) {
      const type = classifyPeriod(statuses[periodo - 1], encontro, Boolean(record));
      if (type === 'presente') counts.presencas += 1;
      if (type === 'ausente') counts.faltas += 1;
      if (type === 'dispensado') counts.dispensasExplicitas += 1;
      if (type === 'atestado') counts.atestados += 1;
      if (type === 'dispensaAutomatica') counts.dispensasAutomaticas += 1;
      if (type === 'semRegistro') counts.semRegistro += 1;

      periods.push({ encontro, periodo, type });
    }
  }

  const dispensas = counts.dispensasExplicitas + counts.atestados + counts.dispensasAutomaticas;
  const periodosValidos = counts.presencas + dispensas;
  const periodosRestantesPossiveis = Math.max(
    0,
    (TOTAL_ENCOUNTERS - launchedEncounters.size) * PERIODS_PER_ENCOUNTER
  );
  let situacao = CERTIFICATION_STATUS.acompanhamento;

  if (periodosValidos >= MIN_VALID_PERIODS) {
    situacao = CERTIFICATION_STATUS.apto;
  } else if (periodosValidos + periodosRestantesPossiveis < MIN_VALID_PERIODS) {
    situacao = CERTIFICATION_STATUS.naoApto;
  }

  let observacao = 'Atenção: ainda depende de novos registros para atingir o mínimo.';
  if (situacao === CERTIFICATION_STATUS.apto) {
    observacao = 'Apto: já cumpriu o mínimo presencial.';
  }
  if (situacao === CERTIFICATION_STATUS.naoApto) {
    observacao = 'Não apto: não consegue mais atingir 7 períodos válidos.';
  }
  if (
    situacao === CERTIFICATION_STATUS.acompanhamento
    && periodosValidos + periodosRestantesPossiveis <= MIN_VALID_PERIODS
  ) {
    observacao = 'Risco alto: precisa validar todos os períodos restantes.';
  }

  return {
    ...student,
    encontros: Object.fromEntries(student.encontros),
    periods,
    periodosPrevistos: TOTAL_PERIODS,
    presencas: counts.presencas,
    faltas: counts.faltas,
    dispensas,
    dispensasExplicitas: counts.dispensasExplicitas,
    atestados: counts.atestados,
    dispensasAutomaticas: counts.dispensasAutomaticas,
    semRegistro: counts.semRegistro,
    periodosValidos,
    percentualFrequencia: percent(periodosValidos, TOTAL_PERIODS),
    periodosRestantesPossiveis,
    situacao,
    observacao
  };
}

function uniqueCount(items, selector) {
  return new Set(items.map(selector).filter(Boolean)).size;
}

function buildSummary(students) {
  const totalCursistas = students.length;
  const aptos = students.filter((student) => student.situacao === CERTIFICATION_STATUS.apto).length;
  const acompanhamento = students.filter((student) => student.situacao === CERTIFICATION_STATUS.acompanhamento).length;
  const naoAptos = students.filter((student) => student.situacao === CERTIFICATION_STATUS.naoApto).length;
  const presencas = students.reduce((sum, student) => sum + student.presencas, 0);
  const faltas = students.reduce((sum, student) => sum + student.faltas, 0);
  const dispensas = students.reduce((sum, student) => sum + student.dispensas, 0);
  const validos = students.reduce((sum, student) => sum + student.periodosValidos, 0);

  return {
    totalCursistas,
    totalTurmas: uniqueCount(students, (student) => student.turma),
    totalMunicipios: uniqueCount(students, (student) => student.municipio),
    totalEducadores: uniqueCount(students, (student) => student.educador),
    periodosPorCursista: TOTAL_PERIODS,
    periodosPrevistosTotal: totalCursistas * TOTAL_PERIODS,
    presencas,
    faltas,
    dispensas,
    percentualGeralFrequencia: percent(validos, totalCursistas * TOTAL_PERIODS),
    aptos,
    acompanhamento,
    naoAptos,
    percentualAptos: percent(aptos, totalCursistas),
    percentualAcompanhamento: percent(acompanhamento, totalCursistas),
    percentualNaoAptos: percent(naoAptos, totalCursistas)
  };
}

function buildBreakdowns(students) {
  const byEncounter = Array.from({ length: TOTAL_ENCOUNTERS }, (_, index) => ({
    encontro: `${index + 1}º encontro`,
    presencas: 0,
    faltas: 0,
    dispensas: 0,
    semRegistro: 0
  }));

  for (const student of students) {
    for (const period of student.periods) {
      const bucket = byEncounter[period.encontro - 1];
      if (period.type === 'presente') {
        bucket.presencas += 1;
      } else if (period.type === 'ausente') {
        bucket.faltas += 1;
      } else if (['dispensado', 'atestado', 'dispensaAutomatica'].includes(period.type)) {
        bucket.dispensas += 1;
      } else {
        bucket.semRegistro += 1;
      }
    }
  }

  const groupBy = (dimension) => {
    const map = new Map();

    for (const student of students) {
      const key = student[dimension] || 'Não informado';
      if (!map.has(key)) {
        map.set(key, {
          nome: key,
          cursistas: 0,
          aptos: 0,
          acompanhamento: 0,
          naoAptos: 0,
          frequenciaMedia: 0
        });
      }

      const item = map.get(key);
      item.cursistas += 1;
      if (student.situacao === CERTIFICATION_STATUS.apto) item.aptos += 1;
      if (student.situacao === CERTIFICATION_STATUS.acompanhamento) item.acompanhamento += 1;
      if (student.situacao === CERTIFICATION_STATUS.naoApto) item.naoAptos += 1;
      item.frequenciaMedia += student.percentualFrequencia;
    }

    return [...map.values()]
      .map((item) => ({
        ...item,
        frequenciaMedia: Math.round((item.frequenciaMedia / item.cursistas) * 10) / 10
      }))
      .sort((a, b) => b.cursistas - a.cursistas || a.nome.localeCompare(b.nome));
  };

  return {
    byEncounter,
    byTurma: groupBy('turma'),
    byMunicipio: groupBy('municipio'),
    byEducador: groupBy('educador'),
    bySituacao: groupBy('situacao'),
    byStatusInscricao: groupBy('statusInscricao')
  };
}

export function buildAttendanceModel(rows) {
  const studentsByKey = new Map();
  const launchedEncounters = new Set();
  const launchedEncountersByTurma = new Map();

  for (const row of rows) {
    const key = studentKey(row);
    if (!studentsByKey.has(key)) studentsByKey.set(key, createStudent(row));
    const student = studentsByKey.get(key);
    addEncounter(student, row);

    const encontro = encounterNumber(row.n_encontro);
    if (encontro) {
      launchedEncounters.add(encontro);
      if (!launchedEncountersByTurma.has(student.turma)) {
        launchedEncountersByTurma.set(student.turma, new Set());
      }
      launchedEncountersByTurma.get(student.turma).add(encontro);
    }
  }

  const students = [...studentsByKey.values()]
    .map((student) => finalizeStudent(
      student,
      launchedEncountersByTurma.get(student.turma) ?? new Set()
    ))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return {
    students,
    launchedEncounters: [...launchedEncounters].sort((a, b) => a - b),
    summary: buildSummary(students),
    breakdowns: buildBreakdowns(students),
    options: {
      turmas: [...new Set(students.map((student) => student.turma))].sort(),
      municipios: [...new Set(students.map((student) => student.municipio))].sort(),
      educadores: [...new Set(students.map((student) => student.educador))].sort(),
      statusInscricao: [...new Set(students.map((student) => student.statusInscricao))].sort()
    }
  };
}

function hasEncounterLaunch(student, encontro) {
  if (!encontro) return true;
  if (Object.prototype.hasOwnProperty.call(student.encontros, String(encontro))) return true;
  if (encontro !== 1) return false;

  return student.periods.some((period) => (
    period.encontro === 1 && period.type === 'dispensaAutomatica'
  ));
}

export function applyFilters(model, filters) {
  const busca = normalizeValue(filters.busca || '');
  const encontro = filters.encontro && filters.encontro !== 'Todos'
    ? encounterNumber(filters.encontro)
    : 0;
  const students = model.students.filter((student) => {
    const searchableContent = [
      student.nome,
      student.cpf,
      student.inscricao,
      student.turma,
      student.municipio,
      student.educador
    ].join(' ');
    const matchesBusca = !busca || normalizeValue(searchableContent).includes(busca);

    return matchesBusca
      && hasEncounterLaunch(student, encontro)
      && (!filters.turma || filters.turma === 'Todos' || student.turma === filters.turma)
      && (!filters.municipio || filters.municipio === 'Todos' || student.municipio === filters.municipio)
      && (!filters.educador || filters.educador === 'Todos' || student.educador === filters.educador)
      && (!filters.situacao || filters.situacao === 'Todos' || student.situacao === filters.situacao)
      && (!filters.statusInscricao || filters.statusInscricao === 'Todos' || student.statusInscricao === filters.statusInscricao);
  });

  return {
    ...model,
    students,
    summary: buildSummary(students),
    breakdowns: buildBreakdowns(students)
  };
}
