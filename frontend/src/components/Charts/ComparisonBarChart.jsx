import React from 'react';
import { BarChart, Bar, XAxis, YAxis, LabelList } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '../ui/chart';

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
    const inside = width > 40;
    return (
      <text
        x={inside ? x + width - 4 : x + width + 4}
        y={y + height / 2}
        fill={inside ? '#fff' : '#000'}
        textAnchor={inside ? 'end' : 'start'}
        dominantBaseline="middle"
        fontSize={14}
      >
        {value} {units[dataset[index].metric]}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="bg-white p-2 rounded shadow border text-sm">
        {payload.map(p => {
          const name = p.dataKey === 'veh1' ? metrics1.name : metrics2.name;
          const unit = units[p.payload.metric];
          return (
            <div key={p.dataKey}>{`${name} — ${p.payload.metric}: ${p.value} ${unit}`}</div>
          );
        })}
      </div>
    );
  };

  const financeData = [
    {
      metric: 'Dépense totale',
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
      metric: 'Coût par km',
      veh1: metrics1.costPerKm ? parseFloat(metrics1.costPerKm) : 0,
      veh2: metrics2.costPerKm ? parseFloat(metrics2.costPerKm) : 0
    }
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2 text-center">
          <CardTitle title="Dépenses et distance parcourue">Dépenses et distance parcourue</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ChartContainer>
            <BarChart layout="vertical" data={financeData} margin={{ left: 40 }} barGap={12}>
              <XAxis type="number" />
              <YAxis dataKey="metric" type="category" width={140} />
              <ChartTooltip content={<CustomTooltip />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="veh1" name={metrics1.name} fill="#3b82f6" barSize={18} radius={8} animationDuration={800}>
                <LabelList dataKey="veh1" content={renderLabel('veh1', '#3b82f6', financeData)} />
              </Bar>
              <Bar dataKey="veh2" name={metrics2.name} fill="#10b981" barSize={18} radius={8} animationDuration={800}>
                <LabelList dataKey="veh2" content={renderLabel('veh2', '#10b981', financeData)} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 text-center">
          <CardTitle title="Indicateurs de performance">Indicateurs de performance</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ChartContainer>
            <BarChart layout="vertical" data={perfData} margin={{ left: 40 }} barGap={12}>
              <XAxis type="number" />
              <YAxis dataKey="metric" type="category" width={140} />
              <ChartTooltip content={<CustomTooltip />} />
              <ChartLegend content={<ChartLegendContent />} />
              <Bar dataKey="veh1" name={metrics1.name} fill="#3b82f6" barSize={18} radius={8} animationDuration={800}>
                <LabelList dataKey="veh1" content={renderLabel('veh1', '#3b82f6', perfData)} />
              </Bar>
              <Bar dataKey="veh2" name={metrics2.name} fill="#10b981" barSize={18} radius={8} animationDuration={800}>
                <LabelList dataKey="veh2" content={renderLabel('veh2', '#10b981', perfData)} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
