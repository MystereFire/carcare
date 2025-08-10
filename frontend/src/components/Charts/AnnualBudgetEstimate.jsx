import React, { useState } from 'react';

export default function AnnualBudgetEstimate({ data }) {
  const [filter, setFilter] = useState("all");

  const cleaned = data.filter(e => e.type !== 'acquisition');
  const filteredData = filter === "all" ? cleaned : cleaned.filter(e => e.type === filter);

  if (!filteredData || filteredData.length < 2) {
    return (
      <div className="p-4 rounded-2xl shadow-sm border border-gray-100 bg-gradient-to-r from-indigo-500 to-purple-500 text-white h-40 flex flex-col justify-center">
        <h3 className="text-lg font-semibold mb-2" title="Estimation budget annuel">💰 Estimation budget annuel</h3>
        <FilterButtons filter={filter} setFilter={setFilter} />
        <p className="text-sm text-white/80">Pas assez de données</p>
      </div>
    );
  }

  const sorted = [...filteredData].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstDate = new Date(sorted[0].date);
  const lastDate = new Date(sorted[sorted.length - 1].date);

  const days = (lastDate - firstDate) / (1000 * 3600 * 24);
  const total = filteredData.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const factor = 365 / days;
  const estimate = days > 0 ? (total * factor).toFixed(2) : total;

  return (
    <div className="p-4 rounded-2xl shadow-sm border border-gray-100 bg-gradient-to-r from-indigo-500 to-purple-500 text-white h-40 flex flex-col justify-center">
      <h3 className="text-lg font-semibold mb-2" title="Estimation budget annuel">💰 Estimation budget annuel</h3>
      <FilterButtons filter={filter} setFilter={setFilter} />
      <p className="text-3xl font-bold">{estimate} €</p>
      <p className="text-xs opacity-80 mt-1">
        Basé sur <strong>{total.toFixed(2)} €</strong> sur {Math.round(days)} jours
        (du {firstDate.toLocaleDateString('fr-FR')} au {lastDate.toLocaleDateString('fr-FR')})
      </p>
    </div>
  );
}

function FilterButtons({ filter, setFilter }) {
  const buttons = ["all", "fuel", "repair", "maintenance"];
  return (
    <div className="flex gap-2 mb-2">
      {buttons.map((b) => (
        <button
          key={b}
          onClick={() => setFilter(b)}
          className={`px-2 py-1 rounded text-sm border ${
            filter === b
              ? 'bg-white text-indigo-600'
              : 'bg-white/20 text-white'
          }`}
        >
          {b === "all" ? "Tous" : b.charAt(0).toUpperCase() + b.slice(1)}
        </button>
      ))}
    </div>
  );
}
