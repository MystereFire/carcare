import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import { formatKm, formatDate, computeDomain } from '../../lib/formatters';
import { baseChartOptions } from '../../lib/apexConfig';

export default function KmOverTimeChart({ data }) {

  // Filtrage pour ne garder que l'entrée avec le plus de km par jour
  const maxKmPerDay = {};
  data.forEach(entry => {
    const dateKey = new Date(entry.date).toISOString().split('T')[0];
    if (!maxKmPerDay[dateKey] || entry.km > maxKmPerDay[dateKey].km) {
      maxKmPerDay[dateKey] = entry;
    }
  });

  // Transformation et tri des données
  const filteredData = Object.values(maxKmPerDay)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(d => ({
      ...d,
      timestamp: new Date(d.date).getTime(),
      displayDate: new Date(d.date).toLocaleDateString('fr-FR')
    }));
  const yVals = filteredData.map(d => d.km);
  const [minY, maxY] = computeDomain(yVals);
  const avg = yVals.reduce((s, v) => s + v, 0) / (yVals.length || 1);

  const series = [
    {
      name: 'Km',
      data: filteredData.map(d => ({ x: d.timestamp, y: d.km }))
    }
  ];

  const yAxis = {
    ...baseChartOptions.yaxis,
    min: minY,
    labels: { formatter: formatKm }
  };
  if (maxY !== undefined) yAxis.max = maxY;

  const options = {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, type: 'area' },
    stroke: { ...baseChartOptions.stroke, width: 2 },
    xaxis: {
      ...baseChartOptions.xaxis,
      categories: filteredData.map(d => d.timestamp),
      labels: { formatter: formatDate }
    },
    yaxis: yAxis,
    tooltip: {
      ...baseChartOptions.tooltip,
      y: { formatter: (val) => formatKm(val) },
      x: { formatter: formatDate }
    },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0, stops: [0, 100] }
    },
    colors: ['#8884d8']
  };

  return (
    <Card className="h-64">
      <CardHeader className="pb-2 flex items-center justify-between">
        <CardTitle title="Évolution du kilométrage">📈 Évolution du kilométrage</CardTitle>
        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Moyenne: {formatKm(avg)}</span>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <ReactApexChart options={options} series={series} type="area" height="100%" />
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
