import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from 'recharts';

export default function ComparisonBarChart({ metrics1, metrics2 }) {
  if (!metrics1 || !metrics2) return null;

  const units = {
    'Dépense totale': '€',
    'Distance (km)': 'km',
    'Conso L/100km': 'L/100km',
    'Coût par km': '€/km',
  };

  const renderLabel = (key) => (props) => {
    const { x, y, width, height, value, index } = props;
    return (
      <text
        x={x + width - 4}
        y={y + height / 2}
        fill="white"
        textAnchor="end"
        dominantBaseline="middle"
        fontSize={12}
      >
        {value} {units[data[index].metric]}
      </text>
    );
  };

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
      <h3 className="text-2xl font-semibold text-center mb-4">📊 Comparaison des indicateurs</h3>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart layout="vertical" data={data} margin={{ left: 40 }} barGap={12}>
          <XAxis type="number" />
          <YAxis dataKey="metric" type="category" width={140} />
          <Tooltip />
          <Legend iconType="circle" />
          <Bar dataKey="veh1" name={metrics1.name} fill="#60a5fa" barSize={18} radius={6}>
            <LabelList dataKey="veh1" content={renderLabel('veh1')} />
          </Bar>
          <Bar dataKey="veh2" name={metrics2.name} fill="#34d399" barSize={18} radius={6}>
            <LabelList dataKey="veh2" content={renderLabel('veh2')} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
