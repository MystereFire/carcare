import React from 'react';

export default function KpiCard({ label, value, colorClass = 'text-blue-600' }) {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 text-center">
      <p className={`text-3xl font-bold ${colorClass}`}>{value}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </div>
  );
}
