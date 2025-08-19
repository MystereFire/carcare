import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import { formatEuro, formatDate, computeDomain } from '../../lib/formatters';

export default function CostPer100KmChart({ data }) {

  const sortedData = [...data]
    .filter(d => d.type === 'fuel')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const costPer100Km = [];

  for (let i = 1; i < sortedData.length; i++) {
    const kmDiff = sortedData[i].km - sortedData[i - 1].km;
    const euroPerKm = kmDiff > 0 ? sortedData[i].amount / kmDiff : 0;
    costPer100Km.push({
      date: sortedData[i].date,
      costPer100: parseFloat((euroPerKm * 100).toFixed(2)),
    });
  }

  const avg =
    costPer100Km.reduce((sum, c) => sum + c.costPer100, 0) /
    (costPer100Km.length || 1);
  const yVals = costPer100Km.map(d => d.costPer100);
  const [minY, maxY] = computeDomain(yVals);

  const series = [
    {
      name: 'Coût/100km',
      data: costPer100Km.map(d => ({ x: d.date, y: d.costPer100 }))
    }
  ];

  const options = {
    chart: { type: 'area', toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: { categories: costPer100Km.map(d => d.date), labels: { formatter: formatDate } },
    yaxis: { min: minY, max: maxY, labels: { formatter: formatEuro } },
    tooltip: { y: { formatter: (val) => `${formatEuro(val)}/100km` }, x: { formatter: formatDate } },
    fill: {
      type: 'gradient',
      gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0, stops: [0, 100] }
    },
    colors: ['#f59e0b'],
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
