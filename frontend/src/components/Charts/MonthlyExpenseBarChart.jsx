import React from 'react';
import { BarChart, Bar, XAxis, YAxis, LabelList } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '../ui/chart';

export default function MonthlyExpenseBarChart({ data }) {
  // Regrouper les dépenses par mois et type en fonction de l'année courante
  const grouped = {};

  const currentYear = new Date().getFullYear();

  data.forEach((e) => {
    const date = new Date(e.date);
    if (date.getFullYear() !== currentYear) return; // ✅ ne garde que l'année courante

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

  return (
    <Card className="h-64">
      <CardHeader className="pb-2">
        <CardTitle title="Dépenses mensuelles par type">💸 Dépenses mensuelles par type</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <BarChart data={chartData} barGap={4} margin={{ top: 20, bottom: 20 }}>
            <XAxis dataKey="month" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent formatter={(v) => `${v} €`} />} />
            <ChartLegend content={<ChartLegendContent />} />
            <Bar dataKey="fuel" stackId="a" fill="#3B82F6" animationDuration={600}>
              <LabelList dataKey="fuel" position="top" formatter={(v) => v ? `${v} €` : ''} />
            </Bar>
            <Bar dataKey="maintenance" stackId="a" fill="#10B981" animationDuration={600}>
              <LabelList dataKey="maintenance" position="top" formatter={(v) => v ? `${v} €` : ''} />
            </Bar>
            <Bar dataKey="repair" stackId="a" fill="#FACC15" animationDuration={600}>
              <LabelList dataKey="repair" position="top" formatter={(v) => v ? `${v} €` : ''} />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
