import React, { useState } from 'react';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer, Legend } from 'recharts';

const COLORS = {
  fuel: '#3B82F6',
  maintenance: '#10B981',
  repair: '#FACC15'
};

export default function ExpenseTypePieChart({ data }) {
  const [month, setMonth] = useState('');

  const filtered = month
    ? data.filter((d) => d.date.slice(0, 7) === month)
    : data;

  // Agréger les dépenses par type
  const grouped = filtered.reduce((acc, curr) => {
    const prev = acc[curr.type] || 0;
    const amt = parseFloat(curr.amount || 0);
    acc[curr.type] = parseFloat((prev + amt).toFixed(2));
    return acc;
  }, {});

  const totalByType = Object.entries(grouped)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);
  const total = totalByType.reduce((sum, d) => sum + d.value, 0);

  return (
    <div className="p-4 bg-white rounded-xl shadow-md border border-gray-100 h-64 relative">
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
      <div className="flex items-center justify-center h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={totalByType}
              dataKey="value"
              nameKey="name"
              innerRadius="70%"
              outerRadius="100%"
            >
              {totalByType.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.name] || '#ccc'} />
              ))}
            </Pie>
            <Tooltip formatter={(val) => `${val} €`} />
            <Legend
              layout="horizontal"
              verticalAlign="bottom"
              align="center"
              wrapperStyle={{ marginTop: 10 }}
              formatter={(value, entry) => `${entry.payload.name} ${entry.payload.value} €`}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xl font-bold">
          <span>{total.toFixed(2)} €</span>
        </div>
      </div>
    </div>
  );
}
