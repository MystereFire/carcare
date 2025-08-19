import React from 'react';
import ReactApexChart from 'react-apexcharts';

export interface DonutProps {
  data: any[];
  labelKey: string;
  valueKey: string;
  unit?: string;
  height?: number;
  loading?: boolean;
  error?: boolean;
}

const COLORS = ['#6C7CFF', '#22C55E', '#F59E0B', '#EF4444', '#8EA1FF'];

export function Donut({ data, labelKey, valueKey, unit, height = 220, loading, error }: DonutProps) {
  if (loading) return <div className="h-[220px] animate-pulse bg-muted/40" />;
  if (error) return <div className="flex h-[220px] items-center justify-center text-danger">Erreur</div>;
  if (!data?.length) return <div className="flex h-[220px] items-center justify-center text-foreground/60">No data</div>;

  const series = data.map(d => d[valueKey]);
  const options = {
    chart: { type: 'donut', toolbar: { show: false } },
    labels: data.map(d => d[labelKey]),
    colors: COLORS,
    legend: { position: 'bottom' },
    tooltip: { y: { formatter: (v: number) => `${v}${unit ?? ''}` } }
  };

  return <ReactApexChart options={options} series={series} type="donut" height={height} width="100%" />;
}
