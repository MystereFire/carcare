import React from 'react';
import { cn } from '../../lib/utils';

export interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export function Toolbar({ children, className }: ToolbarProps) {
  return <div className={cn('flex flex-wrap items-center justify-end gap-2', className)}>{children}</div>;
}
