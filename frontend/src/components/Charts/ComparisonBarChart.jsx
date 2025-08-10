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

  const renderLabel = (key, color, dataset) => (props) => {
    const { x, y, width, height, value, index } = props;
    const textColor = color === '#34d399' ? '#000' : '#fff';
    const inside = width > 40;
    return (
      <text
        x={inside ? x + width - 4 : x + width + 4}
        y={y + height / 2}
        fill={textColor}
        textAnchor={inside ? 'end' : 'start'}
        dominantBaseline="middle"
        fontSize={14}
      >
        {value} {units[dataset[index].metric]}
      </text>
    );
  };

  const financeData = [
    {
      metric: 'D\u00e9pense totale',
      veh1: parseFloat(metrics1.totalExpense),
      veh2: parseFloat(metrics2.totalExpense)
    },
    {
      metric: 'Distance (km)',
      veh1: metrics1.distance,
      veh2: metrics2.distance
    }
  ];

  const perfData = [
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
    <div className="space-y-6">
      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-2 text-center" title="Indicateurs financiers et distance">📊 Indicateurs financiers &amp; distance</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart layout="vertical" data={financeData} margin={{ left: 40 }} barGap={12}>
            <XAxis type="number" />
            <YAxis dataKey="metric" type="category" width={140} />
            <Tooltip contentStyle={{ backgroundColor: '#fff' }} />
            <Legend iconType="circle" />
              <Bar dataKey="veh1" name={metrics1.name} fill="#60a5fa" barSize={18} radius={8}>
              <LabelList dataKey="veh1" content={renderLabel('veh1', '#60a5fa', financeData)} />
              </Bar>
              <Bar dataKey="veh2" name={metrics2.name} fill="#34d399" barSize={18} radius={8}>
              <LabelList dataKey="veh2" content={renderLabel('veh2', '#34d399', financeData)} />
              </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-semibold mb-2 text-center" title="Indicateurs de performance">⚙️ Indicateurs de performance</h3>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart layout="vertical" data={perfData} margin={{ left: 40 }} barGap={12}>
            <XAxis type="number" />
            <YAxis dataKey="metric" type="category" width={140} />
            <Tooltip contentStyle={{ backgroundColor: '#fff' }} />
            <Legend iconType="circle" />
            <Bar dataKey="veh1" name={metrics1.name} fill="#60a5fa" barSize={18} radius={8}>
              <LabelList dataKey="veh1" content={renderLabel('veh1', '#60a5fa', perfData)} />
            </Bar>
            <Bar dataKey="veh2" name={metrics2.name} fill="#34d399" barSize={18} radius={8}>
              <LabelList dataKey="veh2" content={renderLabel('veh2', '#34d399', perfData)} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
