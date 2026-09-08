import React from 'react';
import { API_URL } from '../../config';
import { formatCurrency, formatL100, formatKm } from '../../lib/formatters';

export default function VehicleCard({ vehicle, index, bestMap }) {
  if (!vehicle) return null;
  const { totals } = vehicle;
  const imgSrc = vehicle.photoUrl ? `${API_URL}${vehicle.photoUrl}` : '/car-placeholder.svg';

  const color = (metric) => {
    const best = bestMap[metric];
    if (best == null) return 'text-slate-450';
    return best === index ? 'text-emerald-400 font-black speed-font shadow-[0_0_8px_rgba(52,211,153,0.15)]' : 'text-red-400 font-bold';
  };

  return (
    <div className="glass-card border border-white/5 shadow-2xl p-6 rounded-lg space-y-4 relative overflow-hidden group">
      <div className="relative h-32 overflow-hidden rounded-lg bg-slate-950/20 border border-white/5">
        <img
          src={imgSrc}
          alt={`Photo ${vehicle.brand} ${vehicle.model}`}
          className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = '/car-placeholder.svg';
          }}
        />
      </div>
      <h2 className="text-xl font-black text-slate-100 tracking-tight">{vehicle.name}</h2>
      <div className="space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span role="img" aria-label="dépenses" className="text-sm">💶</span>
            <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Dépenses</h3>
          </div>
          <p className={`text-lg ${color('spendEUR')}`}>{formatCurrency(totals.spendEUR)}</p>
        </div>
        <div className="border-t border-white/5 pt-3">
          <div className="flex items-center gap-2 mb-1">
            <span role="img" aria-label="carburant" className="text-sm">⛽</span>
            <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Consommation</h3>
          </div>
          <p className={`text-lg ${color('fuelL100')}`}>{formatL100(totals.fuelL100)}</p>
        </div>
        <div className="border-t border-white/5 pt-3">
          <div className="flex items-center gap-2 mb-1">
            <span role="img" aria-label="coût" className="text-sm">📊</span>
            <h3 className="font-bold text-slate-400 text-xs uppercase tracking-wider">Rendement</h3>
          </div>
          <div className="flex justify-between items-baseline">
            <p className={`text-lg ${color('costPerKm')}`}>{formatCurrency(totals.costPerKm)} / km</p>
            <p className={`text-xs font-semibold text-slate-450`}>{formatKm(totals.distanceKm)} parcourus</p>
          </div>
        </div>
      </div>
    </div>
  );
}
