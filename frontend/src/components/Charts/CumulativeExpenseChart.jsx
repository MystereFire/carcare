import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import { formatEuro, formatDate, computeDomain } from '../../lib/formatters';
import { baseChartOptions, chartColors } from '../../lib/apexConfig';

export default function CumulativeExpenseChart({ data }) {

  const filtered = data.filter(e => e.type !== 'acquisition');
  // Regrouper les montants par date (ISO)
  const amountPerDate = {};

  filtered.forEach((entry) => {
    const dateKey = new Date(entry.date).toISOString().split('T')[0];
    const prev = amountPerDate[dateKey] || 0;
    amountPerDate[dateKey] = parseFloat((prev + entry.amount).toFixed(2));
  });

  // Transformer en tableau trié
  const groupedSortedData = Object.entries(amountPerDate)
    .map(([date, amount]) => ({
      date,
      timestamp: new Date(date).getTime(),
      amount
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Calcul du total cumulé
  let total = 0;
  const cumulative = groupedSortedData.map((d) => {
    total = parseFloat((total + d.amount).toFixed(2));
    return {
      ...d,
      total,
      displayDate: new Date(d.timestamp).toLocaleDateString('fr-FR')
    };
  });
  const yVals = cumulative.map(d => d.total);
  const [minY, maxY] = computeDomain(yVals);
  const avg = yVals.reduce((s, v) => s + v, 0) / (yVals.length || 1);

  const series = [
    {
      name: 'Total',
      data: cumulative.map(d => ({ x: d.timestamp, y: d.total }))
    }
  ];

  const start = cumulative.length ? cumulative[0].timestamp : undefined;
  const end = cumulative.length ? cumulative[cumulative.length - 1].timestamp : undefined;

  const options = {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, type: 'area' },
    xaxis: {
      ...baseChartOptions.xaxis,
      categories: cumulative.map(d => d.timestamp),
      min: start,
      max: end,
      labels: { formatter: formatDate }
    },
    yaxis: { ...baseChartOptions.yaxis, min: minY, max: maxY, labels: { formatter: formatEuro } },
    tooltip: { ...baseChartOptions.tooltip, y: { formatter: formatEuro }, x: { formatter: formatDate } },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0, stops: [0, 100] }
    },
    colors: [chartColors.maintenance]
  };

  return (
    <Card className="h-64">
      <CardHeader className="pb-2 flex items-center justify-between">
        <CardTitle title="Dépenses cumulées">💶 Dépenses cumulées</CardTitle>
        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Moyenne: {formatEuro(avg)}</span>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <ReactApexChart options={options} series={series} type="area" height="100%" />
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
