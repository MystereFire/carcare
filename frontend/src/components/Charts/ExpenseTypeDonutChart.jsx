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

export default function ExpenseTypeDonutChart({ data = [] }) {
  // Aggregate expenses by type over provided data
  const grouped = data.reduce((acc, curr) => {
    const type = curr.type || 'other';
    const prev = acc[type] || 0;
    const amt = parseFloat(curr.amount || 0);
    acc[type] = prev + amt;
    return acc;
  }, {});

  const types = ['fuel', 'maintenance', 'repair', 'other'];
  const series = [];
  const labels = [];
  const colors = [];

  types.forEach((t) => {
    const val = grouped[t] || 0;
    if (val > 0) {
      series.push(parseFloat(val.toFixed(2)));
      labels.push(LABELS[t]);
      colors.push(COLORS[t]);
    }
  });

  const options = {
    chart: {
      type: 'donut',
      toolbar: { show: false },
    },
    colors,
    labels,
    legend: { position: 'bottom' },
    dataLabels: {
      enabled: true,
      formatter: (val, opts) => {
        const amount = opts.w.globals.series[opts.seriesIndex];
        return `${formatEuro(amount)} (${Math.round(val)}%)`;
      },
    },
    tooltip: {
      y: { formatter: (val) => formatEuro(val) },
    },
    plotOptions: {
      pie: {
        donut: {
          size: '72%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: (w) =>
                formatEuro(w.globals.seriesTotals.reduce((a, b) => a + b, 0)),
            },
          },
        },
      },
    },
    noData: { text: 'Aucune donnée sur la période' },
  };

  return (
    <Card className="h-64">
      <CardHeader className="pb-2">
        <CardTitle title="Répartition des dépenses">📊 Répartition des dépenses</CardTitle>
      </CardHeader>
      <CardContent className="h-[220px]">
        <ReactApexChart options={options} series={series} type="donut" height="100%" />
      </CardContent>
    </Card>
  );
}
