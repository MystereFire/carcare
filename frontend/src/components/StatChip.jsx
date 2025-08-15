import React from 'react';
import { cn } from '../lib/utils';

export default function StatChip({ icon: Icon, value, label, className }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-2xl bg-primary/10 px-3 py-2', className)}>
      {Icon && <Icon className="h-4 w-4 text-primary" />}
      <div className="flex flex-col leading-none">
        <span className="text-sm font-semibold">{value}</span>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
    </div>
  );
}
