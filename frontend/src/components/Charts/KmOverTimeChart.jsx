import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

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
      timestamp: new Date(d.date).getTime(),
      displayDate: new Date(d.date).toLocaleDateString('fr-FR')
    }));

  return (
    <div className="p-4 bg-white rounded-2xl shadow-sm border border-gray-100 h-64">
      <h3 className="text-lg font-semibold mb-2" title="Évolution du kilométrage">📈 Évolution du kilométrage</h3>
      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={filteredData}>
          <defs>
            <linearGradient id="kmTime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8884d8" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            ticks={filteredData.map(d => d.timestamp)}
            tickFormatter={t => new Date(t).toLocaleDateString('fr-FR')}
          />
          <YAxis dataKey="km" />
          <Tooltip labelFormatter={t => new Date(t).toLocaleDateString('fr-FR')} />
          <Area type="monotone" dataKey="km" stroke="#8884d8" fill="url(#kmTime)" strokeWidth={2} dot={{ r:3 }} activeDot={{ r:5 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
