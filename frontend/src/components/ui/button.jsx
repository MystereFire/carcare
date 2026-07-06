import React from 'react';
import { cn } from '../../lib/utils';

const variants = {
  accent: 'bg-accent text-white hover:bg-accent/90',
  outline: 'border border-border bg-transparent hover:bg-muted/50',
};

const Button = React.forwardRef(({ className, variant = 'accent', ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      'inline-flex items-center justify-center rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
      variants[variant],
      className
    )}
    {...props}
  />
));
Button.displayName = 'Button';

export { Button };
