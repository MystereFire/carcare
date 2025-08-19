import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import { formatEuro, formatDate, computeDomain } from '../../lib/formatters';
import { baseChartOptions, chartColors } from '../../lib/apexConfig';

export default function CostPerLiterChart({ data }) {

  const grouped = {};
  data
    .filter(d => d.type === 'fuel' && d.liters > 0)
    .forEach(entry => {
      const dateKey = new Date(entry.date).toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = { amount: 0, liters: 0 };
      grouped[dateKey].amount += parseFloat(entry.amount || 0);
      grouped[dateKey].liters += parseFloat(entry.liters || 0);
    });

  const chartData = Object.entries(grouped)
    .map(([date, { amount, liters }]) => ({
      timestamp: new Date(date).getTime(),
      costPerLiter: parseFloat((amount / liters).toFixed(2)),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const avg =
    chartData.reduce((sum, d) => sum + d.costPerLiter, 0) /
    (chartData.length || 1);
  const yVals = chartData.map(d => d.costPerLiter);
  const [minY, maxY] = computeDomain(yVals);

  const series = [
    {
      name: 'Coût/L',
      data: chartData.map(d => ({ x: d.timestamp, y: d.costPerLiter }))
    }
  ];

  const start = chartData.length ? chartData[0].timestamp : undefined;
  const end = chartData.length ? chartData[chartData.length - 1].timestamp : undefined;

  const options = {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, type: 'area' },
    xaxis: {
      ...baseChartOptions.xaxis,
      categories: chartData.map(d => d.timestamp),
      min: start,
      max: end,
      labels: { formatter: formatDate }
    },
    yaxis: { ...baseChartOptions.yaxis, min: minY, max: maxY, labels: { formatter: formatEuro } },
    tooltip: { ...baseChartOptions.tooltip, y: { formatter: (val) => `${formatEuro(val)}/L` }, x: { formatter: formatDate } },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0, stops: [0, 100] }
    },
    colors: [chartColors.fuel]
  };

  return (
    <Card className="h-64">
      <CardHeader className="pb-2 flex items-center justify-between">
        <CardTitle title="Coût au litre">⛽ Coût au litre (€)</CardTitle>
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
