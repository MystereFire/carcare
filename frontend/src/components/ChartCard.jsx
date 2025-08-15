import React from 'react';
import { cn } from '../lib/utils';
import { Card, CardHeader, CardTitle, CardContent } from './ui/card';

export default function ChartCard({ title, children, className }) {
  return (
    <Card className={cn('md:col-span-6 xl:col-span-4', className)}>
      {title && (
        <CardHeader className="pb-2">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className="h-72">{children}</CardContent>
    </Card>
  );
}
