import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

export default function AverageConsumptionChart({ data }) {
  const consumption = data.map(seg => ({
    date: new Date(seg.endDate).toLocaleDateString('fr-FR'),
    consumption: seg.consumption
  }));

  const avg =
    consumption.reduce((sum, c) => sum + c.consumption, 0) /
    (consumption.length || 1);

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
          <XAxis dataKey="date" />
          <YAxis padding={{ top: 10 }} />
          <ChartTooltip content={<ChartTooltipContent formatter={val => `${val} L/100km`} />} />
          <ReferenceLine
            y={avg.toFixed(2)}
            stroke="#f87171"
            strokeWidth={1}
            strokeDasharray="4 2"
            label={{ position: "top", value: `Moyenne ${avg.toFixed(2)}`, fontSize: 12, fill: "#f87171" }}
          />
          <Area type="monotone" dataKey="consumption" stroke="#10b981" fill="url(#consAvg)" strokeWidth={2} dot={{ r:3, stroke:'white' }} activeDot={{ r:5 }} />
        </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
