import React from 'react';
import {
  PieChart,
  Pie,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

export interface DonutProps {
  data: any[];
  labelKey: string;
  valueKey: string;
  unit?: string;
  height?: number;
  loading?: boolean;
  error?: boolean;
}

const COLORS = ['#6C7CFF', '#22C55E', '#F59E0B', '#EF4444', '#8EA1FF'];

export function Donut({ data, labelKey, valueKey, unit, height = 220, loading, error }: DonutProps) {
  if (loading) return <div className="h-[220px] animate-pulse bg-muted/40" />;
  if (error) return <div className="flex h-[220px] items-center justify-center text-danger">Erreur</div>;
  if (!data?.length) return <div className="flex h-[220px] items-center justify-center text-foreground/60">No data</div>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={labelKey} innerRadius={60} outerRadius={80} stroke="transparent">
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip formatter={(v: any) => `${v}${unit ?? ''}`} />
      </PieChart>
    </ResponsiveContainer>
  );
}
