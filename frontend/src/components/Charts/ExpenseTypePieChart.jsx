import React, { useState } from 'react';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from 'recharts';

const COLORS = {
  fuel: '#8884d8',
  maintenance: '#82ca9d',
  repair: '#ffc658'
};

export default function ExpenseTypePieChart({ data }) {
  const [month, setMonth] = useState('');

  const filtered = month
    ? data.filter((d) => d.date.slice(0, 7) === month)
    : data;

  // Agréger les dépenses par type
  const grouped = filtered.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + parseFloat(curr.amount || 0);
    return acc;
  }, {});

  const totalByType = Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">📊 Répartition des dépenses</h3>
      <div className="mb-2">
        <input
          type="month"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="border p-1 rounded"
        />
        {month && (
          <button
            onClick={() => setMonth('')}
            className="ml-2 text-sm text-blue-600 underline"
          >
            Tout
          </button>
        )}
      </div>
      <ResponsiveContainer width="100%" height={250}>
        <PieChart>
          <Pie
            data={totalByType}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            label
          >
            {totalByType.map((entry, i) => (
              <Cell key={i} fill={COLORS[entry.name] || '#ccc'} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
