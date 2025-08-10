import React from 'react';

export default function LastExpenseCard({ expense, onViewAll }) {
  if (!expense) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex items-center justify-center h-full">
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
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col h-full">
      <h3 className="text-lg font-semibold flex items-center gap-2 mb-2" title="Dernière dépense">💧 Dernière dépense</h3>
      <p className="text-gray-700">{expense.label}</p>
      <p className="text-3xl font-bold mt-2">{parseFloat(expense.amount).toFixed(2)} €</p>
      <p className={`${color} font-medium capitalize`}>{expense.type}</p>
      <p className="text-xs text-gray-500 mt-1">{new Date(expense.date).toLocaleDateString()}</p>
      <div className="mt-auto text-right">
        <button
          onClick={onViewAll}
          aria-label="Voir toutes les dépenses"
          className="text-blue-600 hover:underline text-sm"
        >
          Voir toutes les dépenses
        </button>
      </div>
    </div>
  );
}
