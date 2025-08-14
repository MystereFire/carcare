import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

export default function LastExpenseCard({ expense, onViewAll }) {
  if (!expense) {
    return (
      <Card className="h-full flex items-center justify-center">
        <p className="text-gray-600">Aucune dépense enregistrée.</p>
      </Card>
    );
  }

  const typeColors = {
    fuel: 'text-blue-600',
    maintenance: 'text-yellow-600',
    repair: 'text-red-600',
  };
  const color = typeColors[expense.type] || 'text-gray-600';

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <CardTitle title="Dernière dépense">💧 Dernière dépense</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 pt-0">
        <p className="text-gray-700">{expense.label}</p>
        <p className="text-3xl font-bold mt-2">{parseFloat(expense.amount).toFixed(2)} €</p>
        <p className={`${color} font-medium capitalize`}>{expense.type}</p>
        <p className="text-xs text-gray-500 mt-1">{new Date(expense.date).toLocaleDateString('fr-FR')}</p>
        <div className="mt-auto text-right">
          <button
            onClick={onViewAll}
            aria-label="Voir toutes les dépenses"
            className="text-blue-600 hover:underline text-sm"
          >
            Voir toutes les dépenses
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
