import React from 'react';

export default function KpiCard({ label, value, colorClass = 'text-blue-600', bgClass = 'bg-white' }) {
  return (
    <div
      className={`${bgClass} rounded-2xl shadow-sm border border-gray-100 p-4 text-center flex flex-col justify-center h-full`}
    >
      <p className={`font-bold ${colorClass} text-2xl md:text-3xl`}>{value}</p>
      <p className="text-xs text-gray-600 mt-1">{label}</p>
    </div>
  );
}
