import React from 'react';
import { API_URL } from '../../config';
import { formatCurrency, formatL100, formatKm } from '../../lib/formatters';

export default function VehicleCard({ vehicle, index, bestMap }) {
  if (!vehicle) return null;
  const { totals } = vehicle;
  const imgSrc = vehicle.photoUrl ? `${API_URL}${vehicle.photoUrl}` : '/car-placeholder.svg';

  const color = (metric) => {
    const best = bestMap[metric];
    if (best == null) return 'text-gray-700';
    return best === index ? 'text-green-600' : 'text-red-600';
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      <img
        src={imgSrc}
        alt={`Photo ${vehicle.brand} ${vehicle.model}`}
        className="w-full h-32 object-cover rounded-md"
        onError={(e) => {
          e.currentTarget.onerror = null;
          e.currentTarget.src = '/car-placeholder.svg';
        }}
      />
      <h2 className="text-xl font-semibold">{vehicle.name}</h2>
      <div className="space-y-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span role="img" aria-label="dépenses">💶</span>
            <h3 className="font-medium">Dépenses</h3>
          </div>
          <p className={`font-semibold ${color('spendEUR')}`}>{formatCurrency(totals.spendEUR)}</p>
        </div>
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-1">
            <span role="img" aria-label="carburant">⛽</span>
            <h3 className="font-medium">Carburant</h3>
          </div>
          <p className={`font-semibold ${color('fuelL100')}`}>{formatL100(totals.fuelL100)}</p>
        </div>
        <div className="border-t pt-3">
          <div className="flex items-center gap-2 mb-1">
            <span role="img" aria-label="coût">📊</span>
            <h3 className="font-medium">Coût</h3>
          </div>
          <p className={`font-semibold ${color('costPerKm')}`}>{formatCurrency(totals.costPerKm)} / km</p>
          <p className={`text-sm ${color('distanceKm')}`}>{formatKm(totals.distanceKm)}</p>
        </div>
      </div>
    </div>
  );
}
