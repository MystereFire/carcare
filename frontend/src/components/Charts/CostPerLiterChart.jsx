import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

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
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">⛽ Coût au litre (€)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={chartData}>
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            ticks={chartData.map(d => d.timestamp)}
            tickFormatter={t => new Date(t).toLocaleDateString('fr-FR')}
          />
          <YAxis />
          <Tooltip
            labelFormatter={t => new Date(t).toLocaleDateString('fr-FR')}
            formatter={val => `${val} €/L`}
          />
          <ReferenceLine
            y={avg.toFixed(2)}
            stroke="red"
            strokeDasharray="3 3"
            label={{ value: `Moyenne ${avg.toFixed(2)} €/L`, position: 'insideTopRight' }}
          />
          <Line type="monotone" dataKey="costPerLiter" stroke="#ef4444" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
