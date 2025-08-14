import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine, CartesianGrid } from 'recharts';

export default function AverageConsumptionChart({ data }) {
  const consumption = data.map(seg => ({
    date: new Date(seg.endDate).toLocaleDateString('fr-FR'),
    consumption: seg.consumption
  }));

  const avg =
    consumption.reduce((sum, c) => sum + c.consumption, 0) /
    (consumption.length || 1);

  return (
    <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 h-64">
      <h3 className="text-lg font-semibold mb-2" title="Consommation moyenne">⛽ Consommation moyenne (L/100km)</h3>
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
          <YAxis padding={{ top: 10 }} />
          <Tooltip formatter={val => `${val} L/100km`} />
          <ReferenceLine
            y={avg.toFixed(2)}
            stroke="#f87171"
            strokeWidth={1}
            strokeDasharray="4 2"
            label={{ position: "top", value: `Moyenne ${avg.toFixed(2)}`, fontSize: 12, fill: "#f87171" }}
          />
          <Area type="monotone" dataKey="consumption" stroke="#10b981" fill="url(#consAvg)" strokeWidth={2} dot={{ r:3, stroke:'white' }} activeDot={{ r:5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
