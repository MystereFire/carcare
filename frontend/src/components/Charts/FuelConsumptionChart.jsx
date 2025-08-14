import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

export default function FuelConsumptionChart({ data }) {
  const chartData = data.map((d, idx) => ({
    ...d,
    index: idx + 1,
    end: new Date(d.endDate).toLocaleDateString('fr-FR')
  }));

  const mean = chartData.reduce((sum, d) => sum + d.consumption, 0) / (chartData.length || 1);
  const variance = chartData.reduce((sum, d) => sum + Math.pow(d.consumption - mean, 2), 0) / (chartData.length || 1);
  const stdDev = Math.sqrt(variance);

  chartData.forEach((d) => {
    d.anomaly = Math.abs(d.consumption - mean) > 2 * stdDev;
  });

  const renderDot = (props) => {
    const { cx, cy, payload } = props;
    return (
      <circle cx={cx} cy={cy} r={3} stroke="none" fill={payload.anomaly ? 'red' : '#8884d8'} />
    );
  };

  return (
    <Card className="h-64">
      <CardHeader className="pb-2">
        <CardTitle title="Consommation">⛽ Consommation (L/100km)</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="end" />
            <YAxis />
            <ChartTooltip content={<ChartTooltipContent formatter={(val) => `${val} L/100km`} />} />
            <Line type="monotone" dataKey="consumption" stroke="#8884d8" dot={renderDot} />
            <Line type="monotone" dataKey="avgConsumption" stroke="#82ca9d" />
          </LineChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
