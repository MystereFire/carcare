import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import { formatEuro, formatDate, computeDomain } from '../../lib/formatters';
import { baseChartOptions, chartColors } from '../../lib/apexConfig';

export default function CostPer100KmChart({ data }) {

  const sortedData = [...data]
    .sort((a, b) => new Date(a.endDate) - new Date(b.endDate))
    .map(d => ({ ...d, timestamp: new Date(d.endDate).getTime() }));

  const avg =
    sortedData.reduce((sum, c) => sum + c.costPer100, 0) /
    (sortedData.length || 1);
  const yVals = sortedData.map(d => d.costPer100);
  const [minY, maxY] = computeDomain(yVals);

  const series = [
    {
      name: 'Coût/100km',
      data: sortedData.map(d => ({ x: d.timestamp, y: d.costPer100 }))
    }
  ];

  const yAxis = { ...baseChartOptions.yaxis, min: minY, labels: { formatter: formatEuro } };
  if (maxY !== undefined) yAxis.max = maxY;

  const start = sortedData.length ? sortedData[0].timestamp : undefined;
  const end = sortedData.length ? sortedData[sortedData.length - 1].timestamp : undefined;

  const options = {
    ...baseChartOptions,
    chart: { ...baseChartOptions.chart, type: 'area' },
    xaxis: {
      ...baseChartOptions.xaxis,
      categories: sortedData.map(d => d.timestamp),
      min: start,
      max: end,
      labels: { formatter: formatDate }
    },
    yaxis: yAxis,
    tooltip: { ...baseChartOptions.tooltip, y: { formatter: (val) => `${formatEuro(val)}/100km` }, x: { formatter: formatDate } },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0, stops: [0, 100] }
    },
    colors: [chartColors.fuel],
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
        <CardTitle title="Coût moyen aux 100 km">💰 Coût moyen aux 100 km (€)</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <ReactApexChart options={options} series={series} type="area" height="100%" />
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
