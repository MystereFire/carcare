import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ComparisonBarChart({ metrics1, metrics2 }) {
  if (!metrics1 || !metrics2) return null;

  const data = [
    {
      metric: 'D\u00e9pense totale',
      veh1: parseFloat(metrics1.totalExpense),
      veh2: parseFloat(metrics2.totalExpense)
    },
    {
      metric: 'Distance (km)',
      veh1: metrics1.distance,
      veh2: metrics2.distance
    },
    {
      metric: 'Conso L/100km',
      veh1: metrics1.avgConsumption ? parseFloat(metrics1.avgConsumption) : 0,
      veh2: metrics2.avgConsumption ? parseFloat(metrics2.avgConsumption) : 0
    },
    {
      metric: 'Co\u00fbt par km',
      veh1: metrics1.costPerKm ? parseFloat(metrics1.costPerKm) : 0,
      veh2: metrics2.costPerKm ? parseFloat(metrics2.costPerKm) : 0
    }
  ];

  return (
    <div className="mb-6">
      <h3 className="text-lg font-semibold mb-2">Comparaison visuelle</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart layout="vertical" data={data} margin={{ left: 40 }}>
          <XAxis type="number" />
          <YAxis dataKey="metric" type="category" width={120} />
          <Tooltip />
          <Legend />
          <Bar dataKey="veh1" name={metrics1.name} fill="#8884d8" />
          <Bar dataKey="veh2" name={metrics2.name} fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
