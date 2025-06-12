import React from 'react';
import { PieChart, Pie, Tooltip, Cell, ResponsiveContainer } from 'recharts';

const COLORS = {
  fuel: '#8884d8',
  maintenance: '#82ca9d',
  repair: '#ffc658'
};

export default function ExpenseTypePieChart({ data }) {
  // Agréger les dépenses par type
  const grouped = data.reduce((acc, curr) => {
    acc[curr.type] = (acc[curr.type] || 0) + parseFloat(curr.amount || 0);
    return acc;
  }, {});

  const totalByType = Object.entries(grouped).map(([name, value]) => ({
    name,
    value,
  }));

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">📊 Répartition des dépenses</h3>
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
