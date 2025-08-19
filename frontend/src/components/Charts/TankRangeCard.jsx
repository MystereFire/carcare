import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { formatKm } from '../../lib/formatters';

export default function TankRangeCard({ data, tankSize }) {
  if (!data?.length || !tankSize) {
    return (
      <Card className="h-64 flex flex-col items-center justify-center text-center">
        <CardHeader className="pb-2">
          <CardTitle title="Autonomie sur un plein">🔋 Autonomie plein</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <p className="text-gray-500">Pas assez de données</p>
        </CardContent>
      </Card>
    );
  }

  const avgKmPerLiter =
    data.reduce((sum, seg) => sum + seg.km / seg.liters, 0) / data.length;
  const range = avgKmPerLiter * tankSize;

  return (
    <Card className="h-64 flex flex-col items-center justify-center text-center">
      <CardHeader className="pb-2">
        <CardTitle title="Autonomie sur un plein">🔋 Autonomie plein</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <p className="text-3xl font-bold">{formatKm(range)}</p>
        <p className="text-sm text-gray-500">basé sur la conso moyenne de la période</p>
      </CardContent>
    </Card>
  );
}
