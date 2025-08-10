import React from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

export default function FullToFullConsumptionChart({ data }) {
  const chartData = data.map((d, idx) => ({
    ...d,
    index: idx + 1,
    end: new Date(d.endDate).toLocaleDateString('fr-FR')
  }));

  const mean = chartData.reduce((sum, d) => sum + d.consumption, 0) / (chartData.length || 1);
  const variance = chartData.reduce((sum, d) => sum + Math.pow(d.consumption - mean, 2), 0) / (chartData.length || 1);
  const stdDev = Math.sqrt(variance);

  chartData.forEach((d, i) => {
    const start = Math.max(0, i - 2);
    const subset = chartData.slice(start, i + 1);
    d.mavg = subset.reduce((s, x) => s + x.consumption, 0) / subset.length;
    d.anomaly = Math.abs(d.consumption - mean) > 2 * stdDev;
  });

  const renderDot = (props) => {
    const { cx, cy, payload } = props;
    return (
      <circle cx={cx} cy={cy} r={3} stroke="none" fill={payload.anomaly ? 'red' : '#8884d8'} />
    );
  };

  return (
    <div className="p-4 bg-white rounded-xl shadow-md border border-gray-100 h-64">
      <h3 className="text-lg font-semibold mb-2">⛽ Consommation full-to-full (L/100km)</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="end" />
          <YAxis />
          <Tooltip formatter={(val) => `${val} L/100km`} />
          <Line type="monotone" dataKey="consumption" stroke="#8884d8" dot={renderDot} />
          <Line type="monotone" dataKey="mavg" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
