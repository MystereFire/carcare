import React from 'react';
import { cn } from '../lib/utils';

export default function Section({ title, subtitle, actions, children, className = '' }) {
  return (
    <section
      className={cn(
        'flex flex-col rounded-lg bg-white dark:bg-muted/20 p-4 shadow-sm text-center',
        className
      )}
    >
      <header className="mb-2 flex items-start justify-between">
        <div className="text-left">
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle && <p className="text-sm text-foreground/60">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  );
}
