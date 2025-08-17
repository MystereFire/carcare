import React from 'react';
import { cn } from '../../lib/utils';

export interface SectionProps {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  dense?: boolean;
  className?: string;
}

export function Section({ title, actions, children, dense, className }: SectionProps) {
  return (
    <section className={cn('rounded-xl border border-border/40 bg-muted/40', className)}>
      <header className="flex items-center justify-between p-4">
        <h3 className="text-lg font-semibold">{title}</h3>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      <div className={cn('p-4', dense && 'py-2')}>{children}</div>
    </section>
  );
}
