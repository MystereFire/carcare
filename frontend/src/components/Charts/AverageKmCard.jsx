import React from 'react';

export default function AverageKmCard({ data }) {
  if (!data || data.length < 2) {
    return (
      <div className="bg-white p-4 rounded shadow mb-4">
        <h3 className="text-lg font-semibold">📈 Moyenne km/jour</h3>
        <p className="text-gray-500">Pas assez de données</p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  const days = (new Date(sorted[sorted.length - 1].date) - new Date(sorted[0].date)) / (1000 * 3600 * 24);
  const km = sorted[sorted.length - 1].km - sorted[0].km;
  const avg = days > 0 ? (km / days).toFixed(2) : 0;

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="text-lg font-semibold">📈 Moyenne km/jour</h3>
      <p className="text-2xl font-bold">{avg} km</p>
    </div>
  );
}
