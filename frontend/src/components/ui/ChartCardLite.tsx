import React from 'react';
import { cn } from '../../lib/utils';

export interface ChartCardLiteProps {
  title: string;
  legend?: React.ReactNode;
  footer?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function ChartCardLite({ title, legend, footer, children, className }: ChartCardLiteProps) {
  return (
    <div className={cn('rounded-xl border border-border/40 bg-muted/40', className)}>
      <div className="flex items-center justify-between p-4">
        <h4 className="text-sm font-medium">{title}</h4>
        {legend}
      </div>
      <div className="px-4 pb-2">{children}</div>
      {footer && <div className="px-4 pb-4 text-sm text-foreground/60">{footer}</div>}
    </div>
  );
}
