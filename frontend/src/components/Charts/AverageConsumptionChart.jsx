import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

export default function AverageConsumptionChart({ data }) {
  const number = new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 2
  });

  const consumption = data.map(seg => ({
    date: new Date(seg.endDate).toLocaleDateString('fr-FR'),
    consumption: seg.consumption
  }));

  const avg =
    consumption.reduce((sum, c) => sum + c.consumption, 0) /
    (consumption.length || 1);
  const yVals = consumption.map(d => d.consumption);
  const minY = Math.min(...yVals);
  const maxY = Math.max(...yVals);

  return (
    <Card className="h-64">
      <CardHeader className="pb-2">
        <CardTitle title="Consommation moyenne">⛽ Consommation moyenne (L/100km)</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <AreaChart data={consumption}>
          <defs>
            <linearGradient id="consAvg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={20} preserveStartEnd />
          <YAxis
            domain={[minY * 0.9, maxY * 1.1]}
            tickFormatter={v => number.format(v)}
          />
          <ChartTooltip content={<ChartTooltipContent formatter={val => `${number.format(val)} L/100km`} />} />
          <ReferenceLine
            y={avg}
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="4 2"
            label={{ position: 'top', value: `Moyenne ${number.format(avg)}`, fontSize: 12, fill: '#6b7280' }}
          />
          <Area
            type="monotone"
            dataKey="consumption"
            stroke="#10b981"
            fill="url(#consAvg)"
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
