export const chartColors = {
  fuel: '#3B82F6',
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
  grid: { borderColor: '#E5E7EB', strokeDashArray: 3 },
  dataLabels: { enabled: false },
  xaxis: {
    type: 'datetime',
    tickAmount: 6,
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
  },
  noData: { text: 'Aucune donnée sur la période' },
  colors: [chartColors.fuel, chartColors.maintenance, chartColors.repair, chartColors.other],
};
