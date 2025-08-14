import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

export default function CumulativeExpenseChart({ data }) {
  const filtered = data.filter(e => e.type !== 'acquisition');
  // Regrouper les montants par date (ISO)
  const amountPerDate = {};

  filtered.forEach((entry) => {
    const dateKey = new Date(entry.date).toISOString().split('T')[0];
    const prev = amountPerDate[dateKey] || 0;
    amountPerDate[dateKey] = parseFloat((prev + entry.amount).toFixed(2));
  });

  // Transformer en tableau trié
  const groupedSortedData = Object.entries(amountPerDate)
    .map(([date, amount]) => ({
      date,
      timestamp: new Date(date).getTime(),
      amount
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Calcul du total cumulé
  let total = 0;
  const cumulative = groupedSortedData.map((d) => {
    total = parseFloat((total + d.amount).toFixed(2));
    return {
      ...d,
      total,
      displayDate: new Date(d.timestamp).toLocaleDateString('fr-FR')
    };
  });

  return (
    <Card className="h-64">
      <CardHeader className="pb-2">
        <CardTitle title="Dépenses cumulées">💶 Dépenses cumulées</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <AreaChart data={cumulative}>
          <defs>
            <linearGradient id="cumulExp" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#82ca9d" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#82ca9d" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            ticks={cumulative.map(d => d.timestamp)}
            tickFormatter={(unixTime) => new Date(unixTime).toLocaleDateString('fr-FR')}
          />
          <YAxis />
          <ChartTooltip content={<ChartTooltipContent />} labelFormatter={(unixTime) => `Date: ${new Date(unixTime).toLocaleDateString('fr-FR')}`} />
          <Area type="monotone" dataKey="total" stroke="#82ca9d" fill="url(#cumulExp)" strokeWidth={2} dot={{ r:3 }} activeDot={{ r:5 }} />
        </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
