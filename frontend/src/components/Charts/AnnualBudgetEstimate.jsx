import React, { useState } from 'react';

export default function AnnualBudgetEstimate({ data }) {
  const [filter, setFilter] = useState("all");

  const cleaned = data.filter(e => e.type !== 'acquisition');
  const filteredData = filter === "all" ? cleaned : cleaned.filter(e => e.type === filter);

  if (!filteredData || filteredData.length < 2) {
    return (
      <div className="bg-white p-4 rounded shadow mb-4">
        <h3 className="text-lg font-semibold mb-2">📆 Estimation budget annuel</h3>
        <FilterButtons filter={filter} setFilter={setFilter} />
        <p className="text-gray-500">Pas assez de données</p>
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
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="text-lg font-semibold mb-2">📆 Estimation budget annuel</h3>
      <FilterButtons filter={filter} setFilter={setFilter} />
      <p className="text-2xl font-bold">{estimate} €</p>
      <p className="text-sm text-gray-500 mt-1">
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
            filter === b ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-700"
          }`}
        >
          {b === "all" ? "Tous" : b.charAt(0).toUpperCase() + b.slice(1)}
        </button>
      ))}
    </div>
  );
}
