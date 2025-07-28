import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

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
    <div className="p-4 bg-white rounded-xl shadow-md border border-gray-100 h-64">
      <h3 className="text-lg font-semibold mb-2">⛽ Consommation moyenne (L/100km)</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={consumption}>
          <defs>
            <linearGradient id="consAvg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={val => `${val} L/100km`} />
          <ReferenceLine y={avg.toFixed(2)} stroke="red" strokeDasharray="3 3" label={{ value: `Moyenne ${avg.toFixed(2)} L`, position: 'insideTopRight' }} />
          <Area type="monotone" dataKey="consumption" stroke="#10b981" fill="url(#consAvg)" strokeWidth={2} dot={{ r:3 }} activeDot={{ r:5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
