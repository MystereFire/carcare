import React from 'react';

export default function TankRangeCard({ data, tankSize }) {
  if (!data?.length || !tankSize) {
    return (
      <div className="p-4 rounded-2xl shadow-sm border border-gray-100 bg-white h-64 flex flex-col justify-center">
        <h3 className="text-lg font-semibold" title="Autonomie sur un plein">⛽️ Autonomie plein</h3>
        <p className="text-gray-500">Pas assez de données</p>
      </div>
    );
  }

  const avgKmPerLiter =
    data.reduce((sum, seg) => sum + seg.km / seg.liters, 0) / data.length;
  const range = (avgKmPerLiter * tankSize).toFixed(2);

  return (
    <div className="p-4 rounded-2xl shadow-sm border border-gray-100 bg-white h-64 flex flex-col justify-center">
      <h3 className="text-lg font-semibold" title="Autonomie sur un plein">⛽️ Autonomie plein</h3>
      <p className="text-3xl font-bold">{range} km</p>
    </div>
  );
}
