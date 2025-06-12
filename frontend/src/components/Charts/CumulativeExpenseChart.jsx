import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CumulativeExpenseChart({ data }) {
  const sortedData = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));

  let total = 0;
  const cumulative = sortedData.map((d) => {
    total += d.amount;
    return {
      ...d,
      total,
      date: new Date(d.date).toLocaleDateString('fr-FR') // 👈 ici le format FR
    };
  });

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">💶 Dépenses cumulées</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={cumulative}>
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="total" stroke="#82ca9d" fill="#82ca9d" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
