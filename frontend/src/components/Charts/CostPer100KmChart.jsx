import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

export default function CostPer100KmChart({ data }) {
  const euro = new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR'
  });

  const sortedData = [...data]
    .filter(d => d.type === 'fuel')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const costPer100Km = [];

  for (let i = 1; i < sortedData.length; i++) {
    const kmDiff = sortedData[i].km - sortedData[i - 1].km;
    const euroPerKm = kmDiff > 0 ? sortedData[i].amount / kmDiff : 0;
    costPer100Km.push({
      date: new Date(sortedData[i].date).toLocaleDateString('fr-FR'),
      costPer100: parseFloat((euroPerKm * 100).toFixed(2)),
    });
  }

  const avg =
    costPer100Km.reduce((sum, c) => sum + c.costPer100, 0) /
    (costPer100Km.length || 1);
  const yVals = costPer100Km.map(d => d.costPer100);
  const minY = Math.min(...yVals);
  const maxY = Math.max(...yVals);

  return (
    <Card className="h-64">
      <CardHeader className="pb-2">
        <CardTitle title="Coût moyen aux 100 km">💰 Coût moyen aux 100 km (€)</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <AreaChart data={costPer100Km}>
          <defs>
            <linearGradient id="cost100" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={20} preserveStartEnd />
          <YAxis
            domain={[minY * 0.9, maxY * 1.1]}
            tickFormatter={v => euro.format(v)}
          />
          <ChartTooltip content={<ChartTooltipContent formatter={val => `${euro.format(val)}/100km`} />} />
          <ReferenceLine
            y={avg}
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="4 2"
            label={{ position: 'top', value: `Moyenne ${euro.format(avg)}`, fontSize: 12, fill: '#6b7280' }}
          />
          <Area
            type="monotone"
            dataKey="costPer100"
            stroke="#f59e0b"
            fill="url(#cost100)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
