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

const LABELS = {
  fuel: 'Carburant',
  maintenance: 'Maintenance',
  repair: 'Réparation',
  other: 'Autres',
};

export default function ExpenseTypeBarChart({ data = [], className }) {
  const grouped = data.reduce((acc, curr) => {
    const type = curr.type || 'other';
    const prev = acc[type] || 0;
    const amt = parseFloat(curr.amount || 0);
    acc[type] = prev + amt;
    return acc;
  }, {});

  const types = ['fuel', 'maintenance', 'repair', 'other'];
  const values = [];
  const categories = [];
  const colors = [];

  types.forEach((t) => {
    const val = grouped[t] || 0;
    if (val > 0) {
      values.push(parseFloat(val.toFixed(2)));
      categories.push(LABELS[t]);
      colors.push(COLORS[t]);
    }
  });

  const series = [{ name: 'Montant', data: values }];

  const options = {
    chart: {
      type: 'bar',
      toolbar: { show: false },
    },
    colors,
    plotOptions: {
      bar: {
        horizontal: true,
        distributed: true,
        borderRadius: 6,
        dataLabels: {
          position: 'right',
        },
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val) => formatEuro(val),
      offsetX: 8,
      textAnchor: 'start',
      style: {
        colors: ['#111827'],
      },
    },
    xaxis: {
      labels: { formatter: (val) => formatEuro(val) },
      // Limit the number of ticks to avoid overcrowding under the chart
      tickAmount: 4,
    },
    yaxis: {
      categories,
    },
    tooltip: {
      y: { formatter: (val) => formatEuro(val) },
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 3,
    },
    legend: { show: false },
    noData: { text: 'Aucune donnée sur la période' },
  };

  return (
    <Card className={`h-[260px] ${className || ''}`}>
      <CardHeader className="pb-2">
        <CardTitle title="Répartition des dépenses">📊 Répartition des dépenses</CardTitle>
      </CardHeader>
      <CardContent className="h-[220px]">
        <ReactApexChart options={options} series={series} type="bar" height="100%" />
      </CardContent>
    </Card>
  );
}

