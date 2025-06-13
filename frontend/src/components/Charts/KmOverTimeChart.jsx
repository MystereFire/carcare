import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function KmOverTimeChart({ data }) {
  // Filtrage pour ne garder que l'entrée avec le plus de km par jour
  const maxKmPerDay = {};
  data.forEach(entry => {
    const dateKey = new Date(entry.date).toISOString().split('T')[0];
    if (!maxKmPerDay[dateKey] || entry.km > maxKmPerDay[dateKey].km) {
      maxKmPerDay[dateKey] = entry;
    }
  });

  // Transformation et tri des données
  const filteredData = Object.values(maxKmPerDay)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(d => ({
      ...d,
      date: new Date(d.date).toLocaleDateString('fr-FR')
    }));

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">📈 Évolution du kilométrage</h3>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={filteredData}>
          <XAxis dataKey="date" />
          <YAxis dataKey="km" />
          <Tooltip />
          <Line type="monotone" dataKey="km" stroke="#8884d8" strokeWidth={2} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
