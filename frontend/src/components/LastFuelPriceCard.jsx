import React from 'react';
import Section from './Section';

export default function LastFuelPriceCard({ expenses }) {
  const fuelExpenses = expenses
    .filter(e => e.type === 'fuel' && e.liters > 0)
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  if (!fuelExpenses.length) {
    return (
      <Section title="Coût au litre" className="h-full flex items-center justify-center">
        <p className="text-foreground/60">Aucun relevé.</p>
      </Section>
    );
  }

  const last = fuelExpenses[fuelExpenses.length - 1];
  const pricePerLiter = (parseFloat(last.amount) / parseFloat(last.liters)).toFixed(2);

  return (
    <Section title="Coût au litre" className="h-full flex flex-col">
      <p className="text-3xl font-bold">{pricePerLiter} €/L</p>
      <p className="mt-1 text-xs text-foreground/60">{new Date(last.date).toLocaleDateString('fr-FR')}</p>
    </Section>
  );
}
