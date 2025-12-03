import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import { formatNumber, formatDate, computeDomain } from '../../lib/formatters';
import { baseChartOptions } from '../../lib/apexConfig';

export default function FuelConsumptionChart({ data, className }) {
  const number = formatNumber;

  const chartData = data.map((d, idx) => ({
    ...d,
    index: idx + 1,
    timestamp: new Date(d.endDate).getTime()
  }));

  const mean = chartData.reduce((sum, d) => sum + d.consumption, 0) / (chartData.length || 1);
  const variance = chartData.reduce((sum, d) => sum + Math.pow(d.consumption - mean, 2), 0) / (chartData.length || 1);
  const stdDev = Math.sqrt(variance);

  chartData.forEach((d) => {
    d.anomaly = Math.abs(d.consumption - mean) > 2 * stdDev;
  });

  const yVals = chartData.map(d => d.consumption);
  const [minY, maxY] = computeDomain(yVals);

  const series = [
    {
      name: 'Consommation',
      data: chartData.map((d) => ({
        x: d.timestamp,
        y: d.consumption,
        marker: d.anomaly ? { size: 4, fillColor: 'red' } : { size: 0 }
      }))
    }
  ];

  const yAxis = {
    ...baseChartOptions.yaxis,
    min: minY,
    labels: { formatter: v => `${number(v)} L/100km` }
  };
  if (maxY !== undefined) yAxis.max = maxY;

  const options = {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, type: 'line' },
    xaxis: {
      ...baseChartOptions.xaxis,
      categories: chartData.map(d => d.timestamp),
      labels: { formatter: formatDate }
    },
    yaxis: yAxis,
    tooltip: {
      ...baseChartOptions.tooltip,
      y: { formatter: (val) => `${number(val)} L/100km` },
      x: { formatter: formatDate }
    }
  };

  return (
    <Card className={`h-64 ${className || ''}`}>
      <CardHeader className="pb-2 flex items-center justify-between">
        <CardTitle title="Consommation">⛽ Consommation (L/100km)</CardTitle>
        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Moyenne: {number(mean)}</span>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <ReactApexChart options={options} series={series} type="line" height="100%" />
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
