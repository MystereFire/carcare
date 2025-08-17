import React from 'react';
import Section from './Section';

export default function LastExpenseCard({ expense, onViewAll }) {
  if (!expense) {
    return (
      <Section title="Dernière dépense" className="h-full flex items-center justify-center">
        <p className="text-foreground/60">Aucune dépense enregistrée.</p>
      </Section>
    );
  }

  const typeColors = {
    fuel: 'text-accent',
    maintenance: 'text-warning',
    repair: 'text-danger',
  };
  const color = typeColors[expense.type] || 'text-foreground';

  return (
    <Section
      title="Dernière dépense"
      actions={
        <button
          onClick={onViewAll}
          aria-label="Voir toutes les dépenses"
          className="text-accent hover:underline text-sm"
        >
          Voir toutes les dépenses
        </button>
      }
      className="h-full flex flex-col"
    >
      <p className="text-foreground">{expense.label}</p>
      <p className="mt-2 text-3xl font-bold">{parseFloat(expense.amount).toFixed(2)} €</p>
      <p className={`${color} font-medium capitalize`}>{expense.type}</p>
      <p className="mt-1 text-xs text-foreground/60">{new Date(expense.date).toLocaleDateString('fr-FR')}</p>
    </Section>
  );
}
