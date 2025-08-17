import React from 'react';

export default function Section({ title, subtitle, actions, children, className = '' }) {
  return (
    <section className={`rounded-xl bg-muted/50 p-4 ${className}`}>
      <header className="mb-2 flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold">{title}</h3>
          {subtitle && <p className="text-sm text-foreground/60">{subtitle}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </header>
      {children}
    </section>
  );
}
