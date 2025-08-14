import React from 'react';
import { Card, CardContent } from './ui/card';

export default function KpiCard({ label, value, colorClass = 'text-blue-600', bgClass = 'bg-white' }) {
  return (
    <Card className={`${bgClass} text-center flex flex-col justify-center h-full`}>
      <CardContent className="flex flex-col items-center p-4">
        <p className={`font-bold ${colorClass} text-2xl md:text-3xl`}>{value}</p>
        <p className="text-xs text-gray-600 mt-1">{label}</p>
      </CardContent>
    </Card>
  );
}
