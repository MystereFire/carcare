import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

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
    <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 h-64">
      <h3 className="text-lg font-semibold mb-2" title="Coût moyen aux 100 km">💰 Coût moyen aux 100 km (€)</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={costPer100Km}>
          <defs>
            <linearGradient id="cost100" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis padding={{ top: 10 }} />
          <Tooltip formatter={(val) => `${val} €/100km`} />
          <ReferenceLine
            y={avg.toFixed(2)}
            stroke="#f87171"
            strokeWidth={1}
            strokeDasharray="4 2"
            label={{ position: "top", value: `Moyenne ${avg.toFixed(2)}`, fontSize: 12, fill: "#f87171" }}
          />
          <Area type="monotone" dataKey="costPer100" stroke="#f59e0b" fill="url(#cost100)" strokeWidth={2} dot={{ r:3, stroke:'white' }} activeDot={{ r:5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
