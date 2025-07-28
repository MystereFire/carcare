import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList } from 'recharts';

export default function MonthlyExpenseBarChart({ data }) {
  // Regrouper les dépenses par mois et type en fonction de l'année courante
  const grouped = {};

  const currentYear = new Date().getFullYear();

  data.forEach((e) => {
    const date = new Date(e.date);
    if (date.getFullYear() !== currentYear) return; // ✅ ne garde que l'année courante

    const month = date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
    if (!grouped[month]) grouped[month] = {};
    const prev = grouped[month][e.type] || 0;
    grouped[month][e.type] = parseFloat((prev + e.amount).toFixed(2));
  });

  const chartData = Object.entries(grouped).map(([month, types]) => ({
    month,
    fuel: types.fuel || 0,
    maintenance: types.maintenance || 0,
    repair: types.repair || 0
  }));

  return (
    <div className="p-4 bg-white rounded-xl shadow-md border border-gray-100 h-64">
      <h3 className="text-lg font-semibold mb-2">💸 Dépenses mensuelles par type</h3>
      <ResponsiveContainer width="100%" height={180}>
        <BarChart data={chartData} barGap={4}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip formatter={(v) => `${v} €`} />
          <Legend />
          <Bar dataKey="fuel" stackId="a" fill="#a5b4fc" animationDuration={600}>
            <LabelList dataKey="fuel" position="top" formatter={(v) => v ? `${v} €` : ''} />
          </Bar>
          <Bar dataKey="maintenance" stackId="a" fill="#bbf7d0" animationDuration={600}>
            <LabelList dataKey="maintenance" position="top" formatter={(v) => v ? `${v} €` : ''} />
          </Bar>
          <Bar dataKey="repair" stackId="a" fill="#fde68a" animationDuration={600}>
            <LabelList dataKey="repair" position="top" formatter={(v) => v ? `${v} €` : ''} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
