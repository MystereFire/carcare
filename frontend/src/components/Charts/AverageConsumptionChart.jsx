import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { formatNumber, formatDate, computeDomain } from '../../lib/formatters';

export default function AverageConsumptionChart({ data }) {
  const number = formatNumber;

  const consumption = data.map(seg => ({
    date: seg.endDate,
    consumption: seg.consumption
  }));

  const avg =
    consumption.reduce((sum, c) => sum + c.consumption, 0) /
    (consumption.length || 1);
  const yVals = consumption.map(d => d.consumption);
  const [minY, maxY] = computeDomain(yVals);

  return (
    <Card className="h-64">
      <CardHeader className="pb-2">
        <CardTitle title="Consommation moyenne">⛽ Consommation moyenne (L/100km)</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <AreaChart data={consumption} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
          <defs>
            <linearGradient id="consAvg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" minTickGap={20} preserveStartEnd tickFormatter={formatDate} />
          <YAxis domain={[minY, maxY]} tickFormatter={(v) => `${number(v)} L/100km`} />
          <ChartTooltip content={<ChartTooltipContent formatter={val => `${number(val)} L/100km`} labelFormatter={formatDate} />} />
          <ReferenceLine
            y={avg}
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="4 2"
            label={{ position: 'top', value: `Moyenne ${number(avg)}`, fontSize: 12, fill: '#6b7280', dy: -4 }}
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
