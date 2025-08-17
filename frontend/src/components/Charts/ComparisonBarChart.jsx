import React from 'react';
import { BarChart, Bar, XAxis, YAxis, LabelList, Cell } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartLegend } from '../ui/chart';
import { computeDomain, formatCurrency, formatKm, formatL100, formatNumber } from '../../lib/formatters';
import { computeBest } from '../../lib/compare';

export default function ComparisonBarChart({ metrics1, metrics2 }) {
  if (!metrics1 || !metrics2) return null;

  const number = formatNumber;
  const colorBest = '#16a34a';
  const colorWorse = '#dc2626';

  const units = {
    'Dépense totale': '€',
    'Distance (km)': 'km',
    'Conso L/100km': 'L/100km',
    'Coût par km': '€/km',
  };

  const formatValue = (metric, value) => {
    switch (units[metric]) {
      case '€':
        return formatCurrency(value);
      case 'km':
        return formatKm(value);
      case 'L/100km':
        return formatL100(value);
      case '€/km':
        return `${formatCurrency(value)}/km`;
      default:
        return number.format(value);
    }
  };

  const renderLabel = (key, color, dataset) => (props) => {
    const { x, y, width, height, value, index } = props;
    const inside = width > 40;
    const metric = dataset[index].metric;
    return (
      <text
        x={inside ? x + width - 4 : x + width + 4}
        y={y + height / 2}
        fill={inside ? '#fff' : '#000'}
        textAnchor={inside ? 'end' : 'start'}
        dominantBaseline="middle"
        fontSize={14}
      >
        {formatValue(metric, value)}
      </text>
    );
  };

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload || !payload.length) return null;
    return (
      <div className="rounded-md border bg-white/90 p-2 text-sm shadow-sm">
        {payload.map(p => {
          const name = p.dataKey === 'veh1' ? metrics1.name : metrics2.name;
          return (
            <div key={p.dataKey}>{`${name} — ${p.payload.metric}: ${formatValue(p.payload.metric, p.value)}`}</div>
          );
        })}
      </div>
    );
  };

  const financeData = [
    {
      metric: 'Dépense totale',
      veh1: parseFloat(metrics1.totalExpense),
      veh2: parseFloat(metrics2.totalExpense),
      mode: 'min',
    },
    {
      metric: 'Distance (km)',
      veh1: metrics1.distance,
      veh2: metrics2.distance,
      mode: 'max',
    },
  ];

  const perfData = [
    {
      metric: 'Conso L/100km',
      veh1: metrics1.avgConsumption ? parseFloat(metrics1.avgConsumption) : 0,
      veh2: metrics2.avgConsumption ? parseFloat(metrics2.avgConsumption) : 0,
      mode: 'min',
    },
    {
      metric: 'Coût par km',
      veh1: metrics1.costPerKm ? parseFloat(metrics1.costPerKm) : 0,
      veh2: metrics2.costPerKm ? parseFloat(metrics2.costPerKm) : 0,
      mode: 'min',
    },
  ];

  const financeVals = financeData.flatMap(d => [d.veh1, d.veh2]);
  const perfVals = perfData.flatMap(d => [d.veh1, d.veh2]);
  const [, financeMax] = computeDomain([0, ...financeVals]);
  const [, perfMax] = computeDomain([0, ...perfVals]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2 text-center">
          <CardTitle title="Dépenses et distance parcourue">Dépenses et distance parcourue</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ChartContainer>
            <BarChart layout="vertical" data={financeData} margin={{ top: 10, right: 10, bottom: 10, left: 40 }} barGap={12}>
              <XAxis type="number" domain={[0, financeMax]} tickFormatter={v => number(v)} />
              <YAxis dataKey="metric" type="category" width={140} />
              <ChartTooltip content={<CustomTooltip />} />
              <ChartLegend align="right" verticalAlign="bottom" />
              <Bar dataKey="veh1" name={metrics1.name} barSize={18} radius={8} background={{ fill: '#f1f5f9', radius: 8 }}>
                {financeData.map((entry, index) => {
                  const best = computeBest([entry.veh1, entry.veh2], entry.mode);
                  return <Cell key={`f1-${index}`} fill={best === 0 ? colorBest : colorWorse} />;
                })}
                <LabelList dataKey="veh1" content={renderLabel('veh1', colorBest, financeData)} />
              </Bar>
              <Bar dataKey="veh2" name={metrics2.name} barSize={18} radius={8} background={{ fill: '#f1f5f9', radius: 8 }}>
                {financeData.map((entry, index) => {
                  const best = computeBest([entry.veh1, entry.veh2], entry.mode);
                  return <Cell key={`f2-${index}`} fill={best === 1 ? colorBest : colorWorse} />;
                })}
                <LabelList dataKey="veh2" content={renderLabel('veh2', colorWorse, financeData)} />
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
            <BarChart layout="vertical" data={perfData} margin={{ top: 10, right: 10, bottom: 10, left: 40 }} barGap={12}>
              <XAxis type="number" domain={[0, perfMax]} tickFormatter={v => number(v)} />
              <YAxis dataKey="metric" type="category" width={140} />
              <ChartTooltip content={<CustomTooltip />} />
              <ChartLegend align="right" verticalAlign="bottom" />
              <Bar dataKey="veh1" name={metrics1.name} barSize={18} radius={8} background={{ fill: '#f1f5f9', radius: 8 }}>
                {perfData.map((entry, index) => {
                  const best = computeBest([entry.veh1, entry.veh2], entry.mode);
                  return <Cell key={`p1-${index}`} fill={best === 0 ? colorBest : colorWorse} />;
                })}
                <LabelList dataKey="veh1" content={renderLabel('veh1', colorBest, perfData)} />
              </Bar>
              <Bar dataKey="veh2" name={metrics2.name} barSize={18} radius={8} background={{ fill: '#f1f5f9', radius: 8 }}>
                {perfData.map((entry, index) => {
                  const best = computeBest([entry.veh1, entry.veh2], entry.mode);
                  return <Cell key={`p2-${index}`} fill={best === 1 ? colorBest : colorWorse} />;
                })}
                <LabelList dataKey="veh2" content={renderLabel('veh2', colorWorse, perfData)} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
