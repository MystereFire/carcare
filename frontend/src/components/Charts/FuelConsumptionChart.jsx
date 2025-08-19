import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import { formatNumber, formatDate, computeDomain } from '../../lib/formatters';

export default function FuelConsumptionChart({ data }) {
  const number = formatNumber;

  const chartData = data.map((d, idx) => ({
    ...d,
    index: idx + 1,
    end: d.endDate
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
        x: d.end,
        y: d.consumption,
        marker: d.anomaly ? { size: 4, fillColor: 'red' } : { size: 0 }
      }))
    }
  ];

  const yAxis = { min: minY, labels: { formatter: v => `${number(v)} L/100km` } };
  if (maxY !== undefined) yAxis.max = maxY;

  const options = {
    chart: { type: 'line', toolbar: { show: false } },
    stroke: { curve: 'smooth' },
    markers: { size: 0 },
    xaxis: { categories: chartData.map(d => d.end), labels: { formatter: formatDate } },
    yaxis: yAxis,
    tooltip: {
      y: { formatter: (val) => `${number(val)} L/100km` },
      x: { formatter: formatDate }
    },
    annotations: {
      yaxis: [
        {
          y: mean,
          borderColor: '#94a3b8',
          strokeDashArray: 4,
          label: {
            text: `Moyenne ${number(mean)}`,
            style: { color: '#6b7280', fontSize: '12px' }
          }
        }
      ]
    }
  };

  return (
    <Card className="h-64">
      <CardHeader className="pb-2">
        <CardTitle title="Consommation">⛽ Consommation (L/100km)</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <ReactApexChart options={options} series={series} type="line" height="100%" />
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
