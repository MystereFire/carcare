import React from 'react';

export default function VehicleSelect({ value, onChange, options, disabledId }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="p-2 border rounded w-full"
    >
      <option value="">-- Choisir le véhicule --</option>
      {options.map(opt => (
        <option key={opt.id} value={opt.id} disabled={disabledId === opt.id}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}
