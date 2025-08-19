import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import { formatEuro, computeDomain, formatDate } from '../../lib/formatters';

const COLORS = {
  fuel: '#3B82F6',
  maintenance: '#10B981',
  repair: '#FACC15'
};

export default function MonthlyExpenseBarChart({ data }) {
  // Regrouper les dépenses par mois et type en fonction de l'année courante
  const grouped = {};

  const currentYear = new Date().getFullYear();

  data.forEach((e) => {
    const date = new Date(e.date);
    if (date.getFullYear() !== currentYear) return;

    const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
    if (!grouped[month]) grouped[month] = {};
    const prev = grouped[month][e.type] || 0;
    grouped[month][e.type] = parseFloat((prev + e.amount).toFixed(2));
  });

  const chartData = Object.entries(grouped).map(([month, types]) => ({
    month,
    fuel: types.fuel || 0,
    maintenance: types.maintenance || 0,
    repair: types.repair || 0
  }));

  const totals = chartData.map(d => d.fuel + d.maintenance + d.repair);
  const [minY, maxY] = computeDomain([0, ...totals]);
  const avg = totals.reduce((s, v) => s + v, 0) / (totals.length || 1);
  const showLabels = chartData.length <= 6;

  const categories = chartData.map(d => d.month);
  const series = [
    { name: 'Carburant', data: chartData.map(d => d.fuel) },
    { name: 'Maintenance', data: chartData.map(d => d.maintenance) },
    { name: 'Réparation', data: chartData.map(d => d.repair) }
  ];

  const options = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false } },
    colors: [COLORS.fuel, COLORS.maintenance, COLORS.repair],
    xaxis: {
      categories,
      labels: { formatter: formatDate }
    },
    yaxis: {
      min: minY,
      max: maxY,
      labels: { formatter: formatEuro }
    },
    dataLabels: {
      enabled: showLabels,
      formatter: (val) => (val ? formatEuro(val) : ''),
      offsetY: -10
    },
    tooltip: {
      y: { formatter: formatEuro },
      x: { formatter: formatDate }
    },
    legend: { show: true, position: 'bottom', formatter: (val) => val },
    annotations: {
      yaxis: [
        {
          y: avg,
          borderColor: '#94a3b8',
          strokeDashArray: 4,
          label: {
            text: `Moyenne ${formatEuro(avg)}`,
            style: { color: '#6b7280', fontSize: '12px' }
          }
        }
      ]
    }
  };

  return (
    <Card className="h-64">
      <CardHeader className="pb-2">
        <CardTitle title="Dépenses mensuelles par type">💸 Dépenses mensuelles par type</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <ReactApexChart options={options} series={series} type="bar" height="100%" />
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
