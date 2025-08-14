import React from 'react';
import { ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { cn } from '../../lib/utils';

export function ChartContainer({ children, className, ...props }) {
  return (
    <div className={cn('relative w-full h-full', className)} {...props}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

export const ChartTooltip = ({ content, ...props }) => (
  <Tooltip content={content} wrapperStyle={{ zIndex: 1000 }} {...props} />
);

export function ChartTooltipContent({ active, payload, label, formatter }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-md border bg-white/90 p-2 text-sm shadow-sm">
      {label && <div className="mb-1 text-xs font-medium">{label}</div>}
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />
          {p.name || p.dataKey}: {formatter ? formatter(p.value) : p.value}
        </div>
      ))}
    </div>
  );
}

export const ChartLegend = (props) => <Legend wrapperStyle={{ paddingTop: 8 }} {...props} />;

export function ChartLegendContent({ payload }) {
  if (!payload || !payload.length) return null;
  return (
    <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
      {payload.map((entry) => (
        <div key={entry.value} className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
          {entry.value}
        </div>
      ))}
    </div>
  );
}
