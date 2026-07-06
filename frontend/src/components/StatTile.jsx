import React from 'react';

export default function StatTile({ label, value, icon: Icon }) {
  return (
    <div className="flex items-center gap-3 rounded-xl bg-muted/50 p-4">
      {Icon && <Icon className="h-5 w-5 text-accent" aria-hidden="true" />}
      <div className="flex flex-col">
        <span className="text-2xl font-bold">{value}</span>
        <span className="text-xs text-foreground/60">{label}</span>
      </div>
    </div>
  );
}
