import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function AverageConsumptionChart({ data }) {
  const sortedData = [...data]
    .filter(d => d.type === 'fuel' && d.liters > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  const consumption = [];

  for (let i = 1; i < sortedData.length; i++) {
    const kmDiff = sortedData[i].km - sortedData[i - 1].km;
    if (kmDiff > 0) {
      const value = (sortedData[i].liters / kmDiff) * 100;
      consumption.push({
        date: new Date(sortedData[i].date).toLocaleDateString('fr-FR'),
        consumption: parseFloat(value.toFixed(2))
      });
    }
  }

  const avg =
    consumption.reduce((sum, c) => sum + c.consumption, 0) /
    (consumption.length || 1);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">⛽ Consommation moyenne (L/100km)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={consumption}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={val => `${val} L/100km`} />
          <ReferenceLine y={avg.toFixed(2)} stroke="red" strokeDasharray="3 3" label={{ value: `Moyenne ${avg.toFixed(2)} L`, position: 'insideTopRight' }} />
          <Line type="monotone" dataKey="consumption" stroke="#10b981" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
