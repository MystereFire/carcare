import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Cell, LabelList, ReferenceLine } from 'recharts';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent
} from '../ui/chart';
import ChartCard from '../ChartCard';
import { formatEuro, computeDomain } from '../../lib/formatters';

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
  const yValues = totalByType.map(d => d.value);
  const [minY, maxY] = computeDomain([0, ...yValues]);
  const avg = totalByType.reduce((s, d) => s + d.value, 0) / (totalByType.length || 1);
  const showLabels = totalByType.length <= 6;

  return (
    <ChartCard title="📊 Répartition des dépenses" className="relative">
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
      <ChartContainer className="h-[180px]">
        <BarChart data={totalByType} margin={{ top: 10, right: 10, bottom: 10, left: 10 }} barCategoryGap={20}>
            <XAxis dataKey="name" minTickGap={20} preserveStartEnd />
            <YAxis domain={[minY, maxY]} tickFormatter={formatEuro} />
            <ChartTooltip content={<ChartTooltipContent formatter={formatEuro} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <ReferenceLine
              y={avg}
              stroke="#94a3b8"
              strokeDasharray="4 2"
              strokeWidth={1}
              label={{ position: 'top', value: `Moyenne ${formatEuro(avg)}`, fontSize: 12, fill: '#6b7280', dy: -4 }}
            />
            <Bar dataKey="value" name="Montant" radius={8}>
              {showLabels && <LabelList dataKey="value" position="top" formatter={formatEuro} />}
              {totalByType.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.name] || '#ccc'} />
              ))}
            </Bar>
        </BarChart>
      </ChartContainer>
      <div className="text-center font-bold mt-2">{formatEuro(total)}</div>
    </ChartCard>
  );
}
