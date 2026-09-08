import React from 'react';
import { cn } from '../../lib/utils';

const variants = {
  accent: 'bg-accent text-slate-950 hover:bg-accent/90 shadow-lg shadow-accent/10',
  outline: 'border border-border/70 bg-slate-950/20 hover:bg-muted/50',
};

const Button = React.forwardRef(({ className, variant = 'accent', ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 disabled:opacity-50 disabled:pointer-events-none',
      variants[variant],
      className
    )}
    {...props}
  />
));
Button.displayName = 'Button';

export { Button };
