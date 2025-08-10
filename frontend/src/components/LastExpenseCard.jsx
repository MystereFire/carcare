import React from 'react';

export default function LastExpenseCard({ expense, onViewAll }) {
  if (!expense) {
    return (
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
        <p className="text-gray-600">Aucune dépense enregistrée.</p>
      </div>
    );
  }

  const typeColors = {
    fuel: 'text-blue-600',
    maintenance: 'text-yellow-600',
    repair: 'text-red-600',
  };
  const color = typeColors[expense.type] || 'text-gray-600';

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 relative">
      <div className="flex items-center gap-2 mb-1">
        <span role="img" aria-label="carburant" className="text-2xl">⛽</span>
        <span className="font-medium">{expense.label}</span>
      </div>
      <p className="text-3xl font-bold">{parseFloat(expense.amount).toFixed(2)} €</p>
      <p className={`${color} font-medium capitalize`}>{expense.type}</p>
      <p className="text-sm text-gray-500">{new Date(expense.date).toLocaleDateString()}</p>
      <button
        onClick={onViewAll}
        aria-label="Voir toutes les dépenses"
        className="text-blue-600 hover:underline text-sm absolute bottom-2 right-2"
      >
        Voir toutes les dépenses
      </button>
    </div>
  );
}
