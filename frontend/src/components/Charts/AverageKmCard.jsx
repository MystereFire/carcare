import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

export default function AverageKmCard({ data }) {
  if (!data || data.length < 2) {
    return (
      <Card className="h-64 flex flex-col justify-center text-center">
        <CardHeader>
          <CardTitle title="Moyenne km par jour">🚗 Moyenne km/jour</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-gray-500">Pas assez de données</p>
        </CardContent>
      </Card>
    );
  }

  const sorted = [...data].sort((a, b) => new Date(a.date) - new Date(b.date));
  const days = (new Date(sorted[sorted.length - 1].date) - new Date(sorted[0].date)) / (1000 * 3600 * 24);
  const km = sorted[sorted.length - 1].km - sorted[0].km;
  const avg = days > 0 ? (km / days).toFixed(2) : 0;

  return (
    <Card className="h-64 flex flex-col justify-center text-center">
      <CardHeader className="pb-2 flex items-center justify-between">
        <CardTitle title="Moyenne km par jour">🚗 Moyenne km/jour</CardTitle>
        <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Moyenne: {avg} km</span>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-3xl font-bold">{avg} km</p>
      </CardContent>
    </Card>
  );
}
