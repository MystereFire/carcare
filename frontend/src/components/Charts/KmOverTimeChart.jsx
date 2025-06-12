import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function KmOverTimeChart({ data }) {
  const sortedData = [...data]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((d) => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('fr-FR') // 👈 format FR
    }));

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">📈 Évolution du kilométrage</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={sortedData}>
          <XAxis dataKey="date" />
          <YAxis dataKey="km" />
          <Tooltip />
          <Line type="monotone" dataKey="km" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
