import React from 'react';

export default function AnnualBudgetEstimate({ data }) {
  if (!data || data.length < 2) {
    return (
      <div className="bg-white p-4 rounded shadow mb-4">
        <h3 className="text-lg font-semibold">📆 Estimation budget annuel</h3>
        <p className="text-gray-500">Pas assez de données</p>
      </div>
    );
  }

  const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  const firstDate = new Date(sorted[0].date);
  const lastDate = new Date(sorted[sorted.length - 1].date);

  const days = (lastDate - firstDate) / (1000 * 3600 * 24);
  const total = data.reduce((sum, e) => sum + parseFloat(e.amount), 0);
  const factor = 365 / days;
  const estimate = days > 0 ? (total * factor).toFixed(2) : total;

  return (
    <div className="bg-white p-4 rounded shadow mb-4">
      <h3 className="text-lg font-semibold mb-1">📆 Estimation budget annuel</h3>
      <p className="text-2xl font-bold">{estimate} €</p>
      <p className="text-sm text-gray-500 mt-1">
        Basé sur <strong>{total.toFixed(2)} €</strong> sur {Math.round(days)} jours
        (du {firstDate.toLocaleDateString('fr-FR')} au {lastDate.toLocaleDateString('fr-FR')})
      </p>
    </div>
  );
}
