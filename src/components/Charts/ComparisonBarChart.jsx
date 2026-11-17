import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { formatCurrency, formatKm, formatL100 } from '../../lib/formatters';

const colors = ['#65d6b1', '#9aa9f2'];
const metrics = [
  { key: 'totalExpense', title: 'Dépenses cumulées', format: formatCurrency },
  { key: 'distance', title: 'Distance parcourue', format: formatKm },
  { key: 'avgConsumption', title: 'Consommation moyenne', format: formatL100 },
  { key: 'costPerKm', title: 'Coût par kilomètre', format: value => value == null ? '—' : `${formatCurrency(value)} / km` },
];

export default function ComparisonBarChart({ metrics1, metrics2 }) {
  if (!metrics1 || !metrics2) return null;
  return (
    <div className="grid gap-5 sm:grid-cols-2">
      {metrics.map(metric => {
        const values = [metrics1, metrics2].map((vehicle, index) => ({
          name: vehicle.name, value: Number.isFinite(vehicle[metric.key]) ? vehicle[metric.key] : null, color: colors[index],
        }));
        const chartValues = values.filter(item => item.value != null);
        return (
          <section key={metric.key} className="app-surface p-5 min-w-0" aria-label={metric.title}>
            <h3 className="text-sm font-semibold text-slate-200 mb-4">{metric.title}</h3>
            <dl className="space-y-3">
              {values.map((item, index) => (
                <div key={index} className="flex items-center justify-between gap-3 text-xs">
                  <dt className="flex items-center gap-2 min-w-0 text-slate-400"><span className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} /><span className="truncate">{item.name}</span></dt>
                  <dd className="font-semibold text-slate-200 whitespace-nowrap">{metric.format(item.value)}</dd>
                </div>
              ))}
            </dl>
            {chartValues.length > 0 ? (
              <div className="h-24 mt-3" aria-hidden="true">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartValues} layout="vertical" margin={{ left: 0, right: 6, top: 0, bottom: 0 }}>
                    <XAxis type="number" hide domain={[0, 'dataMax']} />
                    <YAxis type="category" dataKey="name" hide />
                    <Tooltip cursor={{ fill: '#ffffff05' }} contentStyle={{ background: '#182125', border: '1px solid #ffffff16', borderRadius: 10, color: '#edf3f1', fontSize: 12 }} formatter={(value, _name, props) => [metric.format(value), props.payload.name]} labelFormatter={() => metric.title} />
                    <Bar dataKey="value" barSize={16} radius={[0, 5, 5, 0]} isAnimationActive={false}>{chartValues.map((item, index) => <Cell key={index} fill={item.color} />)}</Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-xs text-slate-500 mt-5">Données insuffisantes pour cet indicateur.</p>}
          </section>
        );
      })}
    </div>
  );
}
