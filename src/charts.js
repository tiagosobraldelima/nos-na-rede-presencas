import { CERTIFICATION_STATUS, COLORS } from './config.js';

const charts = {};

function chartLibrary() {
  return globalThis.Chart ?? globalThis.window?.Chart;
}

function canvasContext(id) {
  const canvas = document.getElementById(id);
  if (!canvas) {
    console.warn(`Canvas #${id} não encontrado.`);
    return null;
  }

  return canvas.getContext?.('2d') ?? canvas;
}

function destroyCharts() {
  Object.values(charts).forEach((chart) => chart?.destroy?.());
  Object.keys(charts).forEach((key) => delete charts[key]);
}

function statusDatasets(items) {
  return [
    {
      label: 'Aptos',
      data: items.map((item) => item.aptos),
      backgroundColor: COLORS.green
    },
    {
      label: 'Em acompanhamento',
      data: items.map((item) => item.acompanhamento),
      backgroundColor: COLORS.yellow
    },
    {
      label: 'Não aptos',
      data: items.map((item) => item.naoAptos),
      backgroundColor: COLORS.red
    }
  ];
}

function renderHorizontalStatusChart(Chart, id, items) {
  const context = canvasContext(id);
  if (!context) return;

  charts[id] = new Chart(context, {
    type: 'bar',
    data: {
      labels: items.map((item) => item.nome),
      datasets: statusDatasets(items)
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: { position: 'bottom' }
      },
      scales: {
        x: { stacked: true, beginAtZero: true },
        y: { stacked: true }
      }
    }
  });
}

export function renderCharts(model) {
  const Chart = chartLibrary();
  destroyCharts();

  if (!Chart) {
    console.warn('Chart.js não está disponível; os gráficos não serão renderizados.');
    return;
  }

  const statusContext = canvasContext('statusChart');
  if (statusContext) {
    charts.statusChart = new Chart(statusContext, {
      type: 'doughnut',
      data: {
        labels: [
          CERTIFICATION_STATUS.apto,
          CERTIFICATION_STATUS.acompanhamento,
          CERTIFICATION_STATUS.naoApto
        ],
        datasets: [{
          data: [
            model.summary?.aptos ?? 0,
            model.summary?.acompanhamento ?? 0,
            model.summary?.naoAptos ?? 0
          ],
          backgroundColor: [COLORS.green, COLORS.yellow, COLORS.red],
          borderColor: COLORS.card,
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  }

  const encounterContext = canvasContext('encounterChart');
  if (encounterContext) {
    const encounters = model.breakdowns?.byEncounter ?? [];
    charts.encounterChart = new Chart(encounterContext, {
      type: 'bar',
      data: {
        labels: encounters.map((item) => item.encontro),
        datasets: [
          {
            type: 'line',
            label: 'Tendência de Válidos',
            data: encounters.map((item) => item.presencas + item.dispensas),
            borderColor: COLORS.blue,
            backgroundColor: COLORS.blue,
            borderWidth: 3,
            tension: 0.35,
            fill: false
          },
          { label: 'Presenças', data: encounters.map((item) => item.presencas), backgroundColor: COLORS.green },
          { label: 'Faltas', data: encounters.map((item) => item.faltas), backgroundColor: COLORS.red },
          { label: 'Dispensas', data: encounters.map((item) => item.dispensas), backgroundColor: COLORS.yellow },
          { label: 'Sem registro', data: encounters.map((item) => item.semRegistro), backgroundColor: COLORS.line }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'bottom' }
        },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true }
        }
      }
    });
  }

  renderHorizontalStatusChart(Chart, 'turmaChart', model.breakdowns?.byTurma ?? []);
  renderHorizontalStatusChart(Chart, 'municipioChart', model.breakdowns?.byMunicipio ?? []);
  renderHorizontalStatusChart(Chart, 'educadorChart', model.breakdowns?.byEducador ?? []);
}
