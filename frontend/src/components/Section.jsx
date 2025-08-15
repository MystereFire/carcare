import React from 'react';
import { cn } from '../lib/utils';

export default function Section({ title, children, className }) {
  return (
    <section className={cn('space-y-4', className)}>
      {title && <h2 className="text-xl font-semibold">{title}</h2>}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-6 xl:grid-cols-12">{children}</div>
    </section>
  );
}
