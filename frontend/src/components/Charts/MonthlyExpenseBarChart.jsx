import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

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
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">💸 Dépenses mensuelles par type</h3>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={chartData}>
          <XAxis dataKey="month" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="fuel" stackId="a" fill="#8884d8" />
          <Bar dataKey="maintenance" stackId="a" fill="#82ca9d" />
          <Bar dataKey="repair" stackId="a" fill="#ffc658" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
