import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { ChartContainer } from '../ui/chart';
import { computeDomain, formatCurrency, formatKm, formatL100, formatNumber } from '../../lib/formatters';
import { computeBest } from '../../lib/compare';

export default function ComparisonBarChart({ metrics1, metrics2 }) {
  if (!metrics1 || !metrics2) return null;

  const number = formatNumber;
  const colorBest = '#16a34a';
  const colorWorse = '#dc2626';

  const units = {
    'Dépense totale': '€',
    'Distance (km)': 'km',
    'Conso L/100km': 'L/100km',
    'Coût par km': '€/km',
  };

  const formatValue = (metric, value) => {
    switch (units[metric]) {
      case '€':
        return formatCurrency(value);
      case 'km':
        return formatKm(value);
      case 'L/100km':
        return formatL100(value);
      case '€/km':
        return `${formatCurrency(value)}/km`;
      default:
        return number.format(value);
    }
  };

  const financeData = [
    {
      metric: 'Dépense totale',
      veh1: parseFloat(metrics1.totalExpense),
      veh2: parseFloat(metrics2.totalExpense),
      mode: 'min',
    },
    {
      metric: 'Distance (km)',
      veh1: metrics1.distance,
      veh2: metrics2.distance,
      mode: 'max',
    },
  ];

  const perfData = [
    {
      metric: 'Conso L/100km',
      veh1: metrics1.avgConsumption ? parseFloat(metrics1.avgConsumption) : 0,
      veh2: metrics2.avgConsumption ? parseFloat(metrics2.avgConsumption) : 0,
      mode: 'min',
    },
    {
      metric: 'Coût par km',
      veh1: metrics1.costPerKm ? parseFloat(metrics1.costPerKm) : 0,
      veh2: metrics2.costPerKm ? parseFloat(metrics2.costPerKm) : 0,
      mode: 'min',
    },
  ];

  const financeVals = financeData.flatMap(d => [d.veh1, d.veh2]);
  const perfVals = perfData.flatMap(d => [d.veh1, d.veh2]);
  const [, financeMax] = computeDomain([0, ...financeVals]);
  const [, perfMax] = computeDomain([0, ...perfVals]);

  const buildChart = (dataset, max) => {
    const categories = dataset.map(d => d.metric);
    const series = [
      {
        name: metrics1.name,
        data: dataset.map(d => ({
          x: d.metric,
          y: d.veh1,
          fillColor:
            computeBest([d.veh1, d.veh2], d.mode) === 0 ? colorBest : colorWorse
        }))
      },
      {
        name: metrics2.name,
        data: dataset.map(d => ({
          x: d.metric,
          y: d.veh2,
          fillColor:
            computeBest([d.veh1, d.veh2], d.mode) === 1 ? colorBest : colorWorse
        }))
      }
    ];

    return {
      series,
      options: {
        chart: { type: 'bar', toolbar: { show: false } },
        plotOptions: {
          bar: { horizontal: true, barHeight: '30%', borderRadius: 8 }
        },
        xaxis: {
          max,
          labels: { formatter: v => number(v) }
        },
        yaxis: { categories },
        dataLabels: {
          enabled: true,
          formatter: (val, opts) =>
            formatValue(categories[opts.dataPointIndex], val)
        },
        tooltip: {
          y: {
            formatter: (val, opts) =>
              formatValue(categories[opts.dataPointIndex], val)
          }
        },
        legend: { position: 'bottom' }
      }
    };
  };

  const financeChart = buildChart(financeData, financeMax);
  const perfChart = buildChart(perfData, perfMax);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2 text-center">
          <CardTitle title="Dépenses et distance parcourue">Dépenses et distance parcourue</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ChartContainer>
            <ReactApexChart
              options={financeChart.options}
              series={financeChart.series}
              type="bar"
              height="100%"
            />
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2 text-center">
          <CardTitle title="Indicateurs de performance">Indicateurs de performance</CardTitle>
        </CardHeader>
        <CardContent className="h-[260px]">
          <ChartContainer>
            <ReactApexChart
              options={perfChart.options}
              series={perfChart.series}
              type="bar"
              height="100%"
            />
          </ChartContainer>
        </CardContent>
      </Card>
    </div>
  );
}
