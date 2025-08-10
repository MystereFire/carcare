import React from 'react';

export default function TankRangeCard({ data, tankSize }) {
  const fuels = [...(data || [])]
    .filter(d => d.type === 'fuel' && d.liters > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (fuels.length < 2 || !tankSize) {
    return (
      <div className="p-4 rounded-2xl shadow-sm border border-gray-100 bg-white h-40 flex flex-col justify-center">
        <h3 className="text-lg font-semibold" title="Autonomie sur un plein">⛽️ Autonomie plein</h3>
        <p className="text-gray-500">Pas assez de données</p>
      </div>
    );
  }

  let total = 0;
  let count = 0;
  for (let i = 1; i < fuels.length; i++) {
    const kmDiff = fuels[i].km - fuels[i - 1].km;
    if (kmDiff > 0) {
      total += kmDiff / fuels[i].liters;
      count++;
    }
  }

  const avgKmPerLiter = count ? total / count : 0;
  const range = (avgKmPerLiter * tankSize).toFixed(2);

  return (
    <div className="p-4 rounded-2xl shadow-sm border border-gray-100 bg-white h-40 flex flex-col justify-center">
      <h3 className="text-lg font-semibold" title="Autonomie sur un plein">⛽️ Autonomie plein</h3>
      <p className="text-3xl font-bold">{range} km</p>
    </div>
  );
}
