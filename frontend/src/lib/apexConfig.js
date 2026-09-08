export const chartColors = {
  fuel: '#14B8A6',
  maintenance: '#10B981',
  repair: '#F59E0B',
  other: '#EF4444',
};

export const baseChartOptions = {
  chart: {
    height: 180,
    parentHeightOffset: 0,
    toolbar: { show: false },
    animations: { enabled: true, speed: 300 },
    group: 'carcare',
  },
  stroke: { width: 3, curve: 'smooth' },
  markers: { size: 0, hover: { size: 3 } },
  grid: { borderColor: 'rgba(148, 163, 184, 0.18)', strokeDashArray: 3 },
  dataLabels: { enabled: false },
  xaxis: {
    type: 'datetime',
    tickAmount: 4,
    labels: { format: 'dd/MM' },
  },
  yaxis: {
    tickAmount: 4,
    forceNiceScale: true,
  },
  tooltip: {
    x: { format: 'dd/MM/yyyy' },
    shared: false,
  },
  legend: {
    position: 'bottom',
    labels: { colors: '#CBD5E1' },
  },
  noData: { text: 'Aucune donnée sur la période' },
  colors: [chartColors.fuel, chartColors.maintenance, chartColors.repair, chartColors.other],
};
