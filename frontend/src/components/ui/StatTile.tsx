import React from 'react';

interface Trend {
  delta: number;
  positive?: boolean;
}

export interface StatTileProps {
  title: string;
  value: React.ReactNode;
  subtitle?: string;
  icon?: React.ReactNode;
  trend?: Trend;
  className?: string;
}

export function StatTile({ title, value, subtitle, icon, trend, className }: StatTileProps) {
  return (
    <div className={`flex flex-col justify-between rounded-xl bg-muted/40 p-4 md:flex-row md:items-center ${className ?? ''}`}>
      <div className="flex items-center gap-3">
        {icon && <span className="text-accent">{icon}</span>}
        <div>
          <p className="text-sm text-foreground/60">{title}</p>
          <p className="text-2xl md:text-3xl font-semibold">{value}</p>
          {subtitle && <p className="text-xs text-foreground/60">{subtitle}</p>}
        </div>
      </div>
      {trend && (
        <div className={`mt-2 flex items-center text-sm md:mt-0 ${trend.positive ? 'text-success' : 'text-danger'}`}>
          {trend.delta > 0 ? '+' : ''}{trend.delta}%
        </div>
      )}
    </div>
  );
}
