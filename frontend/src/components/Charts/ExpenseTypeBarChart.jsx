import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Cell, LabelList } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '../ui/chart';

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
        <ChartContainer className="h-[180px]">
          <BarChart data={totalByType} margin={{ bottom: 20 }} barCategoryGap={20}>
            <XAxis dataKey="name" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent formatter={(val) => `${val} €`} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="value" name="Montant" radius={8}>
              <LabelList dataKey="value" position="top" formatter={(v) => `${v} €`} />
              {totalByType.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.name] || '#ccc'} />
              ))}
            </Bar>
          </BarChart>
        </ChartContainer>
        <div className="text-center font-bold mt-2">{total.toFixed(2)} €</div>
      </CardContent>
    </Card>
  );
}
