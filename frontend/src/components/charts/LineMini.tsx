import React from 'react';
import ReactApexChart from 'react-apexcharts';

export interface LineMiniProps {
  data: any[];
  xKey: string;
  yKey: string;
  unit?: string;
  height?: number;
  loading?: boolean;
  error?: boolean;
}

export function LineMini({ data, xKey, yKey, unit, height = 220, loading, error }: LineMiniProps) {
  if (loading) return <div className="h-[220px] animate-pulse bg-muted/40" />;
  if (error) return <div className="flex h-[220px] items-center justify-center text-danger">Erreur</div>;
  if (!data?.length) return <div className="flex h-[220px] items-center justify-center text-foreground/60">No data</div>;

  const series = [{ name: yKey, data: data.map(d => ({ x: d[xKey], y: d[yKey] })) }];
  const options = {
    chart: { type: 'line', toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: { categories: data.map(d => d[xKey]) },
    yaxis: { labels: { formatter: (v: number) => `${v}${unit ?? ''}` } },
    tooltip: { y: { formatter: (v: number) => `${v}${unit ?? ''}` } },
    grid: { strokeDashArray: 3 },
    colors: ['#3b82f6'],
    dataLabels: { enabled: false },
    markers: { size: 0 }
  };

  return <ReactApexChart options={options} series={series} type="line" height={height} width="100%" />;
}
