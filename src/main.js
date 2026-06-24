import { REFRESH_INTERVAL_MS } from './config.js';
import { fetchSheetRows } from './csv.js';
import { applyFilters, buildAttendanceModel } from './attendanceModel.js';
import { renderCharts } from './charts.js';
import { bindReportDownloads } from './reports.js';
import {
  bindFilterEvents,
  populateFilters,
  readTablePageSize,
  readFilters,
  renderKpis,
  renderLoadState,
  renderReportSummary,
  renderRiskList,
  renderStudentTable
} from './render.js';

let baseModel = null;
let currentFilteredModel = null;
let isLoading = false;
let appStarted = false;
let refreshTimerId = null;

export function render() {
  if (!baseModel) return;

  populateFilters(baseModel, readFilters());
  const filteredModel = applyFilters(baseModel, readFilters());
  currentFilteredModel = filteredModel;
  renderKpis(filteredModel.summary);
  renderReportSummary(filteredModel.summary);
  renderRiskList(filteredModel.students);
  renderStudentTable(filteredModel.students);
  renderCharts(filteredModel);
}

export async function loadData() {
  if (isLoading) return;
  isLoading = true;
  renderLoadState({ status: 'loading', message: 'Carregando dados da planilha...' });

  try {
    const rows = await fetchSheetRows();
    baseModel = buildAttendanceModel(rows);
    populateFilters(baseModel, readFilters());
    render();
    renderLoadState({
      status: 'ok',
      message: 'Dados atualizados',
      updatedAt: new Date()
    });
  } catch (error) {
    console.error('Erro ao carregar dados da planilha:', error);
    renderLoadState({
      status: 'error',
      message: error?.message ?? 'Não foi possível carregar os dados.'
    });
  } finally {
    isLoading = false;
  }
}

export function startApp() {
  if (
    appStarted
    || typeof document === 'undefined'
    || typeof window === 'undefined'
  ) {
    return refreshTimerId;
  }

  appStarted = true;
  bindFilterEvents(render);
  bindReportDownloads(() => ({
    model: currentFilteredModel,
    fullModel: baseModel,
    tablePageSize: readTablePageSize(),
    filters: readFilters()
  }));
  loadData();
  refreshTimerId = window.setInterval(loadData, REFRESH_INTERVAL_MS);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      loadData();
    }
  });

  return refreshTimerId;
}

startApp();
