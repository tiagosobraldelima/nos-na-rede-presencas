import { CERTIFICATION_STATUS, TOTAL_ENCOUNTERS } from './config.js';

const FILTER_IDS = {
  turma: 'filterTurma',
  municipio: 'filterMunicipio',
  educador: 'filterEducador',
  encontro: 'filterEncontro',
  situacao: 'filterSituacao',
  statusInscricao: 'filterStatusInscricao',
  busca: 'filterBusca'
};

const TABLE_PAGE_SIZE_ID = 'tablePageSize';

let currentSortRisk = { col: 'validos', asc: true };
let currentSortMain = { col: 'situacao', asc: true };

function sortData(data, col, asc) {
  return [...data].sort((a, b) => {
    let valA = a[col];
    let valB = b[col];
    
    if (col === 'frequencia') {
      valA = a.percentualFrequencia;
      valB = b.percentualFrequencia;
    } else if (col === 'validos') {
      valA = a.periodosValidos;
      valB = b.periodosValidos;
    } else if (col === 'situacao') {
      const statusPriority = {
        [CERTIFICATION_STATUS.naoApto]: 0,
        [CERTIFICATION_STATUS.acompanhamento]: 1,
        [CERTIFICATION_STATUS.apto]: 2
      };
      valA = statusPriority[a.situacao] ?? 9;
      valB = statusPriority[b.situacao] ?? 9;
    }
    
    if (valA === valB) {
      return String(a.nome).localeCompare(String(b.nome));
    }
    
    if (typeof valA === 'string' && typeof valB === 'string') {
      return asc ? valA.localeCompare(valB) : valB.localeCompare(valA);
    }
    
    return asc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
  });
}

function updateSortHeaders(table, col, asc) {
  document.querySelectorAll(`th.sortable[data-table="${table}"]`).forEach(th => {
    th.classList.remove('active');
    const icon = th.querySelector('i');
    if (icon) {
      icon.className = 'fa-solid fa-sort';
    }
  });
  
  const activeTh = document.querySelector(`th.sortable[data-table="${table}"][data-col="${col}"]`);
  if (activeTh) {
    activeTh.classList.add('active');
    const icon = activeTh.querySelector('i');
    if (icon) {
      icon.className = asc ? 'fa-solid fa-sort-up' : 'fa-solid fa-sort-down';
    }
  }
}

function element(id) {
  return document.getElementById(id);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(Number(value) || 0);
}

function formatPercent(value) {
  return `${new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 1,
    maximumFractionDigits: 1
  }).format(Number(value) || 0)}%`;
}

function formatDateTime(value) {
  if (!value) return '';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  }).format(date).replace(',', '');
}

function setSelectOptions(id, options, selectedValue) {
  const select = element(id);
  if (!select) return;

  const values = ['Todos', ...options.filter(Boolean)];
  const selected = values.includes(selectedValue) ? selectedValue : 'Todos';
  select.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join('');
  select.value = selected;
}

function turmasForSelectedEducador(model, selectedEducador) {
  const allTurmas = model.options?.turmas ?? [];
  if (!selectedEducador || selectedEducador === 'Todos') return allTurmas;
  if (!Array.isArray(model.students) || model.students.length === 0) return allTurmas;

  const linkedTurmas = new Set(
    (model.students ?? [])
      .filter((student) => student.educador === selectedEducador)
      .map((student) => student.turma)
      .filter(Boolean)
  );

  return allTurmas.filter((turma) => linkedTurmas.has(turma));
}

export function populateFilters(model, currentFilters = {}) {
  setSelectOptions(FILTER_IDS.educador, model.options?.educadores ?? [], currentFilters.educador);
  setSelectOptions(
    FILTER_IDS.turma,
    turmasForSelectedEducador(model, currentFilters.educador),
    currentFilters.turma
  );
  setSelectOptions(FILTER_IDS.municipio, model.options?.municipios ?? [], currentFilters.municipio);
  setSelectOptions(
    FILTER_IDS.encontro,
    Array.from({ length: TOTAL_ENCOUNTERS }, (_, index) => `${index + 1}º encontro`),
    currentFilters.encontro
  );
  setSelectOptions(FILTER_IDS.situacao, Object.values(CERTIFICATION_STATUS), currentFilters.situacao);
  setSelectOptions(
    FILTER_IDS.statusInscricao,
    model.options?.statusInscricao ?? [],
    currentFilters.statusInscricao
  );

  const busca = element(FILTER_IDS.busca);
  if (busca) busca.value = currentFilters.busca ?? '';
}

export function renderKpis(summary = {}) {
  const target = element('kpiGrid');
  if (!target) return;

  const cards = [
    ['Cursistas', summary.totalCursistas, 'fa-users', 'blue'],
    ['Turmas', summary.totalTurmas, 'fa-people-group', 'cyan'],
    ['Municípios', summary.totalMunicipios, 'fa-location-dot', 'pink'],
    ['Educadores', summary.totalEducadores, 'fa-chalkboard-user', 'yellow'],
    ['Períodos por cursista', summary.periodosPorCursista, 'fa-list-check', 'blue'],
    ['Períodos previstos total', summary.periodosPrevistosTotal, 'fa-calendar-days', 'cyan'],
    ['Presenças', summary.presencas, 'fa-circle-check', 'green'],
    ['Faltas', summary.faltas, 'fa-circle-xmark', 'red'],
    ['Dispensas', summary.dispensas, 'fa-notes-medical', 'yellow'],
    ['Frequência geral', formatPercent(summary.percentualGeralFrequencia), 'fa-chart-line', 'green'],
    ['Aptos', summary.aptos, 'fa-certificate', 'green'],
    ['Em acompanhamento', summary.acompanhamento, 'fa-clock', 'yellow'],
    ['Não aptos', summary.naoAptos, 'fa-triangle-exclamation', 'red'],
    ['Percentual aptos', formatPercent(summary.percentualAptos), 'fa-percent', 'green'],
    ['Percentual em acompanhamento', formatPercent(summary.percentualAcompanhamento), 'fa-percent', 'yellow'],
    ['Percentual não aptos', formatPercent(summary.percentualNaoAptos), 'fa-percent', 'red']
  ];

  target.innerHTML = cards.map(([label, value, icon, color]) => `
    <article class="kpi-card">
      <span class="kpi-icon ${escapeHtml(color)}"><i class="fa-solid ${escapeHtml(icon)}"></i></span>
      <p>${escapeHtml(label)}</p>
      <strong>${typeof value === 'number' ? formatNumber(value) : escapeHtml(value)}</strong>
    </article>
  `).join('');
}

export function renderReportSummary(summary = {}) {
  const target = element('reportSummary');
  if (!target) return;

  const total = formatNumber(summary.totalCursistas);
  const turmas = formatNumber(summary.totalTurmas);
  const educadores = formatNumber(summary.totalEducadores);
  const frequencia = formatPercent(summary.percentualGeralFrequencia);
  const aptos = formatNumber(summary.aptos);
  const acompanhamento = formatNumber(summary.acompanhamento);
  const naoAptos = formatNumber(summary.naoAptos);
  const percentualAptos = formatPercent(summary.percentualAptos);
  const percentualNaoAptos = formatPercent(summary.percentualNaoAptos);

  target.innerHTML = `
    <article class="report-card">
      <span class="report-label">Recorte atual</span>
      <strong>${total} cursistas</strong>
      <p>${turmas} turmas acompanhadas por ${educadores} educador(es).</p>
    </article>
    <article class="report-card">
      <span class="report-label">Frequência geral</span>
      <strong>${frequencia}</strong>
      <p>Percentual calculado sobre os 10 períodos presenciais previstos por cursista.</p>
    </article>
    <article class="report-card">
      <span class="report-label">Certificação presencial</span>
      <strong>${aptos} aptos</strong>
      <p>${acompanhamento} em acompanhamento e ${naoAptos} não aptos (${percentualAptos} aptos; ${percentualNaoAptos} não aptos).</p>
    </article>
  `;
}

export function renderRiskList(students = []) {
  const target = element('riskTable');
  if (!target) return;

  const riskStudents = students
    .filter((student) => (
      student.situacao === CERTIFICATION_STATUS.naoApto
      || String(student.observacao ?? '').startsWith('Risco alto')
    ));

  const sortedRisk = sortData(riskStudents, currentSortRisk.col, currentSortRisk.asc).slice(0, 12);

  if (sortedRisk.length === 0) {
    target.innerHTML = '<tr><td colspan="7">Nenhum participante em risco nos filtros atuais.</td></tr>';
    return;
  }

  target.innerHTML = sortedRisk.map((student) => {
    let obsText = escapeHtml(student.observacao);
    let obsHtml = `<span class="risk-obs"><i class="fa-solid fa-circle-exclamation"></i> ${obsText}</span>`;
    if (obsText.includes('Não apto:')) {
      obsHtml = `<span class="risk-obs danger"><i class="fa-solid fa-triangle-exclamation"></i> <strong>Não apto:</strong> ${obsText.replace('Não apto:', '').trim()}</span>`;
    }

    return `
    <tr>
      <td class="col-nome"><strong>${escapeHtml(student.nome)}</strong></td>
      <td class="col-meta">${escapeHtml(student.turma)}</td>
      <td class="col-meta">${escapeHtml(student.municipio)}</td>
      <td class="col-meta">${escapeHtml(student.educador)}</td>
      <td><strong>${formatNumber(student.periodosValidos)}</strong></td>
      <td><span class="risk-badge">${formatNumber(student.faltas)}</span></td>
      <td>${obsHtml}</td>
    </tr>
  `}).join('');
  
  updateSortHeaders('risk', currentSortRisk.col, currentSortRisk.asc);
}

export function readTablePageSize() {
  const value = element(TABLE_PAGE_SIZE_ID)?.value ?? '10';
  if (value === 'all') return 'all';
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 10;
}

export function renderStudentTable(students = [], pageSize = readTablePageSize()) {
  const target = element('studentTable');
  if (!target) return;

  if (students.length === 0) {
    target.innerHTML = '<tr><td colspan="10">Nenhum participante encontrado para os filtros atuais.</td></tr>';
    const tableStatus = element('tableDisplayStatus');
    if (tableStatus) {
      tableStatus.textContent = 'Exibindo 0 de 0 participantes do recorte atual.';
    }
    return;
  }

  const sortedStudents = sortData(students, currentSortMain.col, currentSortMain.asc);

  const visibleStudents = pageSize === 'all'
    ? sortedStudents
    : sortedStudents.slice(0, pageSize);

  target.innerHTML = visibleStudents.map((student) => {
    const faltasBadge = student.faltas > 0 
        ? `<span class="risk-badge">${formatNumber(student.faltas)}</span>` 
        : `<strong>0</strong>`;
        
    let icon = '';
    if (student.situacao === CERTIFICATION_STATUS.apto) icon = '<i class="fa-solid fa-circle-check"></i>';
    else if (student.situacao === CERTIFICATION_STATUS.naoApto) icon = '<i class="fa-solid fa-triangle-exclamation"></i>';
    else icon = '<i class="fa-solid fa-clock"></i>';
    
    return `
    <tr>
      <td class="col-nome"><strong>${escapeHtml(student.nome)}</strong></td>
      <td class="col-meta">${escapeHtml(student.turma)}</td>
      <td class="col-meta">${escapeHtml(student.municipio)}</td>
      <td class="col-meta">${escapeHtml(student.educador)}</td>
      <td><strong>${formatNumber(student.presencas)}</strong></td>
      <td>${faltasBadge}</td>
      <td>${formatNumber(student.dispensas)}</td>
      <td><strong>${formatNumber(student.periodosValidos)}</strong></td>
      <td><strong>${formatPercent(student.percentualFrequencia)}</strong></td>
      <td><span class="status-badge ${statusClass(student.situacao)}">${icon} <strong>${escapeHtml(student.situacao)}</strong></span></td>
    </tr>
  `}).join('');

  updateSortHeaders('main', currentSortMain.col, currentSortMain.asc);

  const tableStatus = element('tableDisplayStatus');
  if (tableStatus) {
    tableStatus.textContent = `Exibindo ${formatNumber(visibleStudents.length)} de ${formatNumber(sortedStudents.length)} participantes do recorte atual.`;
  }
}

function statusClass(situacao) {
  if (situacao === CERTIFICATION_STATUS.apto) return 'status-ok';
  if (situacao === CERTIFICATION_STATUS.naoApto) return 'status-danger';
  return 'status-watch';
}

export function renderLoadState({ status, message, updatedAt } = {}) {
  const statusElement = element('loadStatus');
  const updatedElement = element('lastUpdated');
  const timestamp = formatDateTime(updatedAt);

  if (statusElement) {
    statusElement.classList.remove('is-loading', 'is-ok', 'is-error');
    if (status) statusElement.classList.add(`is-${status}`);
  }

  if (updatedElement) {
    updatedElement.textContent = [message, timestamp].filter(Boolean).join(' • ');
  }
}

export function readFilters() {
  return {
    turma: element(FILTER_IDS.turma)?.value || 'Todos',
    municipio: element(FILTER_IDS.municipio)?.value || 'Todos',
    educador: element(FILTER_IDS.educador)?.value || 'Todos',
    encontro: element(FILTER_IDS.encontro)?.value || 'Todos',
    situacao: element(FILTER_IDS.situacao)?.value || 'Todos',
    statusInscricao: element(FILTER_IDS.statusInscricao)?.value || 'Todos',
    busca: element(FILTER_IDS.busca)?.value || ''
  };
}

export function bindFilterEvents(callback) {
  for (const id of Object.values(FILTER_IDS)) {
    const input = element(id);
    if (!input) continue;
    input.addEventListener(id === FILTER_IDS.busca ? 'input' : 'change', callback);
  }

  const resetButton = element('resetFilters');
  if (resetButton) {
    resetButton.addEventListener('click', () => {
      for (const [key, id] of Object.entries(FILTER_IDS)) {
        const input = element(id);
        if (!input) continue;
        input.value = key === 'busca' ? '' : 'Todos';
      }
      callback();
    });
  }

  const tablePageSize = element(TABLE_PAGE_SIZE_ID);
  if (tablePageSize) {
    tablePageSize.addEventListener('change', callback);
  }

  document.querySelectorAll('th.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const table = th.dataset.table;
      const col = th.dataset.col;
      
      if (table === 'risk') {
        if (currentSortRisk.col === col) {
          currentSortRisk.asc = !currentSortRisk.asc;
        } else {
          currentSortRisk.col = col;
          currentSortRisk.asc = true;
        }
      } else if (table === 'main') {
        if (currentSortMain.col === col) {
          currentSortMain.asc = !currentSortMain.asc;
        } else {
          currentSortMain.col = col;
          currentSortMain.asc = true;
        }
      }
      
      callback();
    });
  });
}
