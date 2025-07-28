import React, { useState } from 'react';
import { BarChart, Bar, Tooltip, XAxis, YAxis, Legend, ResponsiveContainer, Cell, LabelList } from 'recharts';

const COLORS = {
  fuel: '#3B82F6',
  maintenance: '#10B981',
  repair: '#FACC15'
};

export default function ExpenseTypeBarChart({ data }) {
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
      <div className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={totalByType} margin={{ bottom: 20 }} barCategoryGap={20}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip formatter={(val) => `${val} €`} />
            <Legend iconType="circle" />
            <Bar dataKey="value" name="Montant" radius={8}>
              <LabelList dataKey="value" position="top" formatter={(v) => `${v} €`} />
              {totalByType.map((entry, i) => (
                <Cell key={i} fill={COLORS[entry.name] || '#ccc'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="text-center font-bold mt-2">{total.toFixed(2)} €</div>
      </div>
    </div>
  );
}
