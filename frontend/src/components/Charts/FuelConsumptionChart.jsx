import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';
import { formatNumber, formatDate, computeDomain } from '../../lib/formatters';

export default function FuelConsumptionChart({ data }) {
  const number = formatNumber;

  const chartData = data.map((d, idx) => ({
    ...d,
    index: idx + 1,
    end: d.endDate
  }));

  const mean = chartData.reduce((sum, d) => sum + d.consumption, 0) / (chartData.length || 1);
  const variance = chartData.reduce((sum, d) => sum + Math.pow(d.consumption - mean, 2), 0) / (chartData.length || 1);
  const stdDev = Math.sqrt(variance);

  chartData.forEach((d) => {
    d.anomaly = Math.abs(d.consumption - mean) > 2 * stdDev;
  });

  const renderDot = ({ cx, cy, payload }) => {
    if (!payload.anomaly) return null;
    return <circle cx={cx} cy={cy} r={3} stroke="none" fill="red" />;
  };

  const yVals = chartData.map(d => d.consumption);
  const [minY, maxY] = computeDomain(yVals);

  return (
    <Card className="h-64">
      <CardHeader className="pb-2">
        <CardTitle title="Consommation">⛽ Consommation (L/100km)</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <LineChart data={chartData} margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="end" minTickGap={20} preserveStartEnd tickFormatter={formatDate} />
            <YAxis domain={[minY, maxY]} tickFormatter={(v) => `${number(v)} L/100km`} />
            <ChartTooltip content={<ChartTooltipContent formatter={(val) => `${number(val)} L/100km`} labelFormatter={formatDate} />} />
            <ReferenceLine y={mean} stroke="#94a3b8" strokeDasharray="4 2" strokeWidth={1} label={{ position: 'top', value: `Moyenne ${number(mean)}`, fontSize: 12, fill: '#6b7280', dy: -4 }} />
            <Line type="monotone" dataKey="consumption" stroke="#8884d8" dot={renderDot} activeDot={{ r: 4 }} />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
