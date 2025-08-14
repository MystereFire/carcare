import React from 'react';
import { BarChart, Bar, XAxis, YAxis, LabelList, ReferenceLine } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '../ui/chart';

export default function MonthlyExpenseBarChart({ data }) {
  const euro = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  });

  // Regrouper les dépenses par mois et type en fonction de l'année courante
  const grouped = {};

  const currentYear = new Date().getFullYear();

  data.forEach((e) => {
    const date = new Date(e.date);
    if (date.getFullYear() !== currentYear) return;

    const month = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    if (!grouped[month]) grouped[month] = {};
    const prev = grouped[month][e.type] || 0;
    grouped[month][e.type] = parseFloat((prev + e.amount).toFixed(2));
  });

  const chartData = Object.entries(grouped).map(([month, types]) => ({
    month,
    fuel: types.fuel || 0,
    maintenance: types.maintenance || 0,
    repair: types.repair || 0
  }));

  const totals = chartData.map(d => d.fuel + d.maintenance + d.repair);
  const maxY = Math.max(...totals, 0);
  const avg = totals.reduce((s, v) => s + v, 0) / (totals.length || 1);
  const showLabels = chartData.length <= 6;

  return (
    <Card className="h-64">
      <CardHeader className="pb-2">
        <CardTitle title="Dépenses mensuelles par type">💸 Dépenses mensuelles par type</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <BarChart data={chartData} barGap={4} margin={{ top: 20, bottom: 20 }}>
            <XAxis dataKey="month" minTickGap={20} preserveStartEnd />
            <YAxis domain={[0, maxY * 1.1]} tickFormatter={v => euro.format(v)} />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => euro.format(v)} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <ReferenceLine y={avg} stroke="#94a3b8" strokeDasharray="4 2" strokeWidth={1} label={{ position: 'top', value: `Moyenne ${euro.format(avg)}`, fontSize: 12, fill: '#6b7280' }} />
            <Bar dataKey="fuel" stackId="a" fill="#3B82F6" animationDuration={600}>
              {showLabels && <LabelList dataKey="fuel" position="top" formatter={(v) => v ? euro.format(v) : ''} />}
            </Bar>
            <Bar dataKey="maintenance" stackId="a" fill="#10B981" animationDuration={600}>
              {showLabels && <LabelList dataKey="maintenance" position="top" formatter={(v) => v ? euro.format(v) : ''} />}
            </Bar>
            <Bar dataKey="repair" stackId="a" fill="#FACC15" animationDuration={600}>
              {showLabels && <LabelList dataKey="repair" position="top" formatter={(v) => v ? euro.format(v) : ''} />}
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
