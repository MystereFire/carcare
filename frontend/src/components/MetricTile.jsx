import React from 'react';
import { cn } from '../lib/utils';

export default function MetricTile({ icon: Icon, value, label, children, className, ...props }) {
  return (
    <div
      className={cn('rounded-2xl bg-card p-4 shadow-sm flex flex-col gap-2', className)}
      {...props}
    >
      <div className="flex items-center gap-2">
        {Icon && <Icon className="h-5 w-5 text-accent" />}
        <h3 className="text-lg font-semibold">{value}</h3>
      </div>
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
      {children}
    </div>
  );
}
