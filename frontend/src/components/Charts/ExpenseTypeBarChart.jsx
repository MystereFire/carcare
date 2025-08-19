import React, { useState } from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { formatEuro } from '../../lib/formatters';

const COLORS = {
  fuel: '#3B82F6',
  maintenance: '#10B981',
  repair: '#FACC15'
};

export default function ExpenseTypeBarChart({ data }) {
  const [month, setMonth] = useState('');

  const filtered = month
    ? data.filter((d) => d.date.slice(0, 7) === month)
    : data;

  // Agréger les dépenses par type
  const grouped = filtered.reduce((acc, curr) => {
    const prev = acc[curr.type] || 0;
    const amt = parseFloat(curr.amount || 0);
    acc[curr.type] = parseFloat((prev + amt).toFixed(2));
    return acc;
  }, {});

  const totalByType = Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);
  const total = totalByType.reduce((sum, d) => sum + d.value, 0);

  const categories = totalByType.map(d => d.name);
  const series = [{ name: 'Montant', data: totalByType.map(d => d.value) }];

  const options = {
    chart: { type: 'bar', toolbar: { show: false } },
    colors: categories.map((c) => COLORS[c] || '#ccc'),
    xaxis: { categories },
    dataLabels: {
      enabled: true,
      formatter: (val) => formatEuro(val),
      offsetY: -20
    },
    yaxis: {
      labels: { formatter: (val) => formatEuro(val) }
    },
    tooltip: {
      y: { formatter: (val) => formatEuro(val) }
    },
    legend: { show: false }
  };

  return (
    <Card className="h-64 relative">
      <CardHeader className="pb-2">
        <CardTitle title="Répartition des dépenses">📊 Répartition des dépenses</CardTitle>
      </CardHeader>
      <CardContent className="h-full">
        <div className="mb-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="border p-1 rounded"
          />
          {month && (
            <button
              onClick={() => setMonth('')}
              className="ml-2 text-sm text-blue-600 underline"
            >
              Tout
            </button>
          )}
        </div>
        <div className="h-[180px]">
          <ReactApexChart options={options} series={series} type="bar" height="100%" />
        </div>
        <div className="text-center font-bold mt-2">{formatEuro(total)}</div>
      </CardContent>
    </Card>
  );
}
