import React from 'react';
import ReactApexChart from 'react-apexcharts';

export interface AreaMiniProps {
  data: any[];
  xKey: string;
  yKey: string;
  unit?: string;
  height?: number;
  loading?: boolean;
  error?: boolean;
}

export function AreaMini({ data, xKey, yKey, unit, height = 220, loading, error }: AreaMiniProps) {
  if (loading) return <div className="h-[220px] animate-pulse bg-muted/40" />;
  if (error) return <div className="flex h-[220px] items-center justify-center text-danger">Erreur</div>;
  if (!data?.length) return <div className="flex h-[220px] items-center justify-center text-foreground/60">No data</div>;

  const series = [{ name: yKey, data: data.map(d => ({ x: d[xKey], y: d[yKey] })) }];
  const options = {
    chart: { type: 'area', toolbar: { show: false } },
    stroke: { curve: 'smooth' },
    xaxis: { categories: data.map(d => d[xKey]) },
    yaxis: { labels: { formatter: (v: number) => `${v}${unit ?? ''}` } },
    tooltip: { y: { formatter: (v: number) => `${v}${unit ?? ''}` } },
    grid: { strokeDashArray: 3 },
    colors: ['#3b82f6'],
    dataLabels: { enabled: false }
  };

  return <ReactApexChart options={options} series={series} type="area" height={height} width="100%" />;
}
