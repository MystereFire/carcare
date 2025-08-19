import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { formatEuro } from '../../lib/formatters';

const COLORS = {
  fuel: '#3B82F6',
  maintenance: '#10B981',
  repair: '#F59E0B',
  other: '#EF4444',
};

export default function MonthlyExpenseBarChart({ data = [] }) {
  // Group expenses by month and type
  const grouped = {};
  data.forEach((e) => {
    const d = new Date(e.date);
    const month = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
    if (!grouped[month]) grouped[month] = { fuel: 0, maintenance: 0, repair: 0, other: 0 };
    const type = e.type || 'other';
    grouped[month][type] += parseFloat(e.amount || 0);
  });

  const months = Object.keys(grouped).sort();
  const chartData = months.map((m) => ({ month: m, ...grouped[m] }));
  const monthsCount = chartData.length;

  const series = [
    { name: 'Carburant', data: chartData.map((d) => d.fuel) },
    { name: 'Maintenance', data: chartData.map((d) => d.maintenance) },
    { name: 'Réparation', data: chartData.map((d) => d.repair) },
    { name: 'Autres', data: chartData.map((d) => d.other) },
  ];

  const categories = chartData.map((d) => new Date(d.month).getTime());

  const baseWidth = monthsCount < 3 ? '80%' : '60%';

  const options = {
    chart: {
      type: 'bar',
      stacked: true,
      toolbar: { show: false },
      parentHeightOffset: 0,
    },
    plotOptions: {
      bar: {
        columnWidth: baseWidth,
        borderRadius: 6,
      },
    },
    responsive: [
      {
        breakpoint: 640,
        options: {
          plotOptions: {
            bar: {
              columnWidth: monthsCount < 3 ? '90%' : '70%',
            },
          },
        },
      },
    ],
    colors: [COLORS.fuel, COLORS.maintenance, COLORS.repair, COLORS.other],
    xaxis: {
      type: 'datetime',
      categories,
      tickAmount: monthsCount > 14 ? 6 : monthsCount,
      labels: {
        rotate: monthsCount > 14 ? -30 : 0,
        formatter: (val, timestamp) =>
          new Date(timestamp).toLocaleDateString('fr-FR', {
            month: 'short',
            year: 'numeric',
          }),
      },
    },
    yaxis: {
      tickAmount: 4,
      forceNiceScale: true,
      labels: { formatter: (val) => formatEuro(val) },
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 3,
    },
    dataLabels: { enabled: false },
    legend: { position: 'bottom' },
    tooltip: {
      shared: true,
      y: { formatter: (val) => formatEuro(val) },
      x: {
        formatter: (val) =>
          new Date(parseInt(val)).toLocaleDateString('fr-FR', {
            month: 'long',
            year: 'numeric',
          }),
      },
    },
    noData: { text: 'Aucune donnée sur la période' },
  };

  return (
    <Card className="h-[320px]">
      <CardHeader className="pb-2">
        <CardTitle title="Dépenses mensuelles par type">💸 Dépenses mensuelles par type</CardTitle>
      </CardHeader>
      <CardContent className="h-[240px]">
        <ReactApexChart options={options} series={series} type="bar" height="100%" />
      </CardContent>
    </Card>
  );
}
