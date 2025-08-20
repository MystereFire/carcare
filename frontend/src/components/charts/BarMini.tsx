import React from 'react';
import ReactApexChart from 'react-apexcharts';

export interface BarMiniProps {
  data: any[];
  xKey: string;
  yKey: string;
  unit?: string;
  height?: number;
  loading?: boolean;
  error?: boolean;
}

export function BarMini({ data, xKey, yKey, unit, height = 220, loading, error }: BarMiniProps) {
  if (loading) return <div className="h-[220px] animate-pulse bg-muted/40" />;
  if (error) return <div className="flex h-[220px] items-center justify-center text-danger">Erreur</div>;
  if (!data?.length) return <div className="flex h-[220px] items-center justify-center text-foreground/60">No data</div>;

  const categories = data.map((d) => d[xKey]);
  const series = [{ name: yKey, data: data.map((d) => d[yKey]) }];
  const options = {
    chart: { type: 'bar', toolbar: { show: false } },
    xaxis: { categories },
    yaxis: { labels: { formatter: (v: number) => `${v}${unit ?? ''}` } },
    tooltip: { y: { formatter: (v: number) => `${v}${unit ?? ''}` } },
    colors: ['#3b82f6'],
    grid: { strokeDashArray: 3 }
  };

  return <ReactApexChart options={options} series={series} type="bar" height={height} width="100%" />;
}
