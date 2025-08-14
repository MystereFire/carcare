import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

export default function CostPerLiterChart({ data }) {
  const grouped = {};
  data
    .filter(d => d.type === 'fuel' && d.liters > 0)
    .forEach(entry => {
      const dateKey = new Date(entry.date).toISOString().split('T')[0];
      if (!grouped[dateKey]) grouped[dateKey] = { amount: 0, liters: 0 };
      grouped[dateKey].amount += parseFloat(entry.amount || 0);
      grouped[dateKey].liters += parseFloat(entry.liters || 0);
    });

  const chartData = Object.entries(grouped)
    .map(([date, { amount, liters }]) => ({
      timestamp: new Date(date).getTime(),
      costPerLiter: parseFloat((amount / liters).toFixed(2)),
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  const avg =
    chartData.reduce((sum, d) => sum + d.costPerLiter, 0) /
    (chartData.length || 1);

  return (
    <Card className="h-64">
      <CardHeader className="pb-2">
        <CardTitle title="Coût au litre">⛽ Coût au litre (€)</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <AreaChart data={chartData}>
          <defs>
            <linearGradient id="costLiter" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            ticks={chartData.map(d => d.timestamp)}
            tickFormatter={t => new Date(t).toLocaleDateString('fr-FR')}
          />
          <YAxis padding={{ top: 10 }} />
          <ChartTooltip
            content={<ChartTooltipContent formatter={val => `${val} €/L`} />}
            labelFormatter={t => new Date(t).toLocaleDateString('fr-FR')}
          />
          <ReferenceLine
            y={avg.toFixed(2)}
            stroke="#f87171"
            strokeWidth={1}
            strokeDasharray="4 2"
            label={{ position: "top", value: `Moyenne ${avg.toFixed(2)}`, fontSize: 12, fill: "#f87171" }}
          />
          <Area
            type="monotone"
            dataKey="costPerLiter"
            stroke="#ef4444"
            fill="url(#costLiter)"
            strokeWidth={2}
            dot={{ r: 3, stroke: 'white' }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
