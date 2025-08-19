import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import { formatNumber, formatDate, computeDomain } from '../../lib/formatters';
import { baseChartOptions } from '../../lib/apexConfig';

export default function AverageConsumptionChart({ data }) {
  const number = formatNumber;

  const consumption = data.map(seg => ({
    date: new Date(seg.endDate).getTime(),
    consumption: seg.avgConsumption ?? seg.consumption
  }));

  const avg =
    consumption.reduce((sum, c) => sum + c.consumption, 0) /
    (consumption.length || 1);
  const yVals = consumption.map(d => d.consumption);
  const [minY, maxY] = computeDomain(yVals);

  const series = [
    {
      name: 'Consommation',
      data: consumption.map(d => ({ x: d.date, y: d.consumption }))
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
    chart: { ...baseChartOptions.chart, type: 'area' },
    stroke: { ...baseChartOptions.stroke, width: 2 },
    xaxis: {
      ...baseChartOptions.xaxis,
      categories: consumption.map(d => d.date),
      labels: { formatter: formatDate }
    },
    yaxis: yAxis,
    tooltip: {
      ...baseChartOptions.tooltip,
      y: { formatter: (val) => `${number(val)} L/100km` },
      x: { formatter: formatDate }
    },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0, stops: [0, 100] }
    },
    colors: ['#10b981'],
    annotations: {
      yaxis: [
        {
          y: avg,
          borderColor: '#94a3b8',
          strokeDashArray: 4,
          label: {
            text: `Moyenne ${number(avg)}`,
            style: { color: '#6b7280', fontSize: '12px' }
          }
        }
      ]
    }
  };

  return (
    <Card className="h-64">
      <CardHeader className="pb-2">
        <CardTitle title="Consommation moyenne">⛽ Consommation moyenne (L/100km)</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <ReactApexChart options={options} series={series} type="area" height="100%" />
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
