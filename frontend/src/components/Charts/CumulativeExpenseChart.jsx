import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function CumulativeExpenseChart({ data }) {
  const filtered = data.filter(e => e.type !== 'acquisition');
  // Regrouper les montants par date (ISO)
  const amountPerDate = {};

  filtered.forEach((entry) => {
    const dateKey = new Date(entry.date).toISOString().split('T')[0];
    const prev = amountPerDate[dateKey] || 0;
    amountPerDate[dateKey] = parseFloat((prev + entry.amount).toFixed(2));
  });

  // Transformer en tableau trié
  const groupedSortedData = Object.entries(amountPerDate)
    .map(([date, amount]) => ({
      date,
      timestamp: new Date(date).getTime(),
      amount
    }))
    .sort((a, b) => a.timestamp - b.timestamp);

  // Calcul du total cumulé
  let total = 0;
  const cumulative = groupedSortedData.map((d) => {
    total = parseFloat((total + d.amount).toFixed(2));
    return {
      ...d,
      total,
      displayDate: new Date(d.timestamp).toLocaleDateString('fr-FR')
    };
  });

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">💶 Dépenses cumulées</h3>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={cumulative}>
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            ticks={cumulative.map(d => d.timestamp)} // 👉 uniquement les timestamps réels
            tickFormatter={(unixTime) =>
              new Date(unixTime).toLocaleDateString('fr-FR')
            }
          />
          <YAxis />
          <Tooltip
            labelFormatter={(unixTime) =>
              `Date: ${new Date(unixTime).toLocaleDateString('fr-FR')}`
            }
          />
          <Area type="monotone" dataKey="total" stroke="#82ca9d" fill="#82ca9d" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
