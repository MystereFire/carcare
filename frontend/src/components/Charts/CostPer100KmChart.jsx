import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function CostPer100KmChart({ data }) {
  const sortedData = [...data]
    .filter(d => d.type === 'fuel') // 👈 garder uniquement le fuel
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

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">💰 Coût moyen aux 100 km (€)</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={costPer100Km}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(val) => `${val} €/100km`} />
          <ReferenceLine
            y={avg.toFixed(2)}
            stroke="red"
            strokeDasharray="3 3"
            label={{ value: `Moyenne ${avg.toFixed(2)} €`, position: 'insideTopRight' }}
          />
          <Line type="monotone" dataKey="costPer100" stroke="#f59e0b" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
