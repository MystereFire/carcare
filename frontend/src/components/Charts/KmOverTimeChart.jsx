import React from 'react';
import { AreaChart, Area, XAxis, YAxis, ReferenceLine, CartesianGrid } from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '../ui/chart';

export default function KmOverTimeChart({ data }) {
  const kmFormatter = new Intl.NumberFormat('fr-FR');

  // Filtrage pour ne garder que l'entrée avec le plus de km par jour
  const maxKmPerDay = {};
  data.forEach(entry => {
    const dateKey = new Date(entry.date).toISOString().split('T')[0];
    if (!maxKmPerDay[dateKey] || entry.km > maxKmPerDay[dateKey].km) {
      maxKmPerDay[dateKey] = entry;
    }
  });

  // Transformation et tri des données
  const filteredData = Object.values(maxKmPerDay)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map(d => ({
      ...d,
      timestamp: new Date(d.date).getTime(),
      displayDate: new Date(d.date).toLocaleDateString('fr-FR')
    }));
  const yVals = filteredData.map(d => d.km);
  const minY = Math.min(...yVals);
  const maxY = Math.max(...yVals);
  const avg = yVals.reduce((s, v) => s + v, 0) / (yVals.length || 1);

  return (
    <Card className="h-64">
      <CardHeader className="pb-2">
        <CardTitle title="Évolution du kilométrage">📈 Évolution du kilométrage</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ChartContainer>
          <AreaChart data={filteredData}>
          <defs>
            <linearGradient id="kmTime" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8884d8" stopOpacity={0.4} />
              <stop offset="100%" stopColor="#8884d8" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={['dataMin', 'dataMax']}
            ticks={filteredData.map(d => d.timestamp)}
            tickFormatter={t => new Date(t).toLocaleDateString('fr-FR')}
            minTickGap={20}
            preserveStartEnd
          />
          <YAxis
            dataKey="km"
            domain={[minY * 0.9, maxY * 1.1]}
            tickFormatter={v => kmFormatter.format(v)}
          />
          <ChartTooltip
            content={<ChartTooltipContent formatter={val => `${kmFormatter.format(val)} km`} />}
            labelFormatter={t => new Date(t).toLocaleDateString('fr-FR')}
          />
          <ReferenceLine
            y={avg}
            stroke="#94a3b8"
            strokeWidth={1}
            strokeDasharray="4 2"
            label={{ position: 'top', value: `Moyenne ${kmFormatter.format(avg)} km`, fontSize: 12, fill: '#6b7280' }}
          />
          <Area
            type="monotone"
            dataKey="km"
            stroke="#8884d8"
            fill="url(#kmTime)"
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        </AreaChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
