import React from 'react';
import { cn } from '../../lib/utils';

export default function MetricBar({ label, value, unit, best, isWorse }) {
  const color = best ? 'bg-green-500' : isWorse ? 'bg-red-500' : 'bg-gray-300';
  return (
    <div className="space-y-1">
      <div className="text-sm text-gray-700">{label}</div>
      <div className="relative h-5 w-full rounded bg-gray-200">
        <div className={cn('h-5 rounded', color)} style={{ width: '100%' }} />
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
          {value}{unit && ` ${unit}`}
        </div>
      </div>
    </div>
  );
}
