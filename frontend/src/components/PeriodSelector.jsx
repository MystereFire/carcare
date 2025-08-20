import React from 'react';
import { Button } from './ui/button';

const periods = [
  { label: '30j', value: 30 },
  { label: '90j', value: 90 },
  { label: '365j', value: 365 },
];

export default function PeriodSelector({ value, onChange }) {
  return (
    <div className="flex flex-wrap gap-2">
      {periods.map((p) => (
        <Button
          key={p.value}
          variant={p.value === value ? 'default' : 'outline'}
          onClick={() => onChange(p.value)}
          className="px-3 py-1"
        >
          {p.label}
        </Button>
      ))}
    </div>
  );
}
