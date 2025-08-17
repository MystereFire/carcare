import React from 'react';
import {
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface AreaMiniProps {
  data: any[];
  xKey: string;
  yKey: string;
  unit?: string;
  height?: number;
  loading?: boolean;
  error?: boolean;
}

export function AreaMini({ data, xKey, yKey, unit, height = 220, loading, error }: AreaMiniProps) {
  if (loading) return <div className="h-[220px] animate-pulse bg-muted/40" />;
  if (error) return <div className="flex h-[220px] items-center justify-center text-danger">Erreur</div>;
  if (!data?.length) return <div className="flex h-[220px] items-center justify-center text-foreground/60">No data</div>;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
        <XAxis dataKey={xKey} className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip formatter={(v: any) => `${v}${unit ?? ''}`} />
        <Area type="monotone" dataKey={yKey} stroke="currentColor" fill="currentColor" />
      </AreaChart>
    </ResponsiveContainer>
  );
}
