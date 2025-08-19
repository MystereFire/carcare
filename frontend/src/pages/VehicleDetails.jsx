import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactApexChart from 'react-apexcharts';
import api from '../api';
import { API_URL } from '../config';
import PageTransition from '../components/PageTransition';

// Helper formatters
const fmtCurrency = new Intl.NumberFormat('fr-FR', {
  style: 'currency',
  currency: 'EUR',
});
const fmtNumber = new Intl.NumberFormat('fr-FR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
const fmtInt = new Intl.NumberFormat('fr-FR');
const fmtDate = new Intl.DateTimeFormat('fr-FR');

const typeColors = {
  fuel: '#3B82F6',
  maintenance: '#10B981',
  repair: '#F59E0B',
  other: '#EF4444',
};

const movingAverage = (arr, n = 3) =>
  arr.map((p, i) => {
    const start = Math.max(0, i - n + 1);
    const slice = arr.slice(start, i + 1);
    const avg = slice.reduce((s, v) => s + v.y, 0) / slice.length;
    return { ...p, y: Number(avg.toFixed(2)) };
  });

export default function VehicleDetails() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [period, setPeriod] = useState(30); // in days
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch raw data
  useEffect(() => {
    const load = async () => {
      try {
        const [veh, exp, t] = await Promise.all([
          api.get(`/api/vehicles/${id}`),
          api.get('/api/expenses', { params: { vehicleId: id } }),
          api.get(`/api/maintenance/${id}`),
        ]);
        setVehicle(veh.data);
        setExpenses(exp.data || []);
        setTasks(t.data || []);
      } catch (e) {
        console.error(e);
        setError('Erreur de chargement');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const periodStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - period);
    return d;
  }, [period]);

  const filteredExpenses = useMemo(
    () =>
      expenses
        .filter((e) => e.date && new Date(e.date) >= periodStart)
        .sort((a, b) => new Date(a.date) - new Date(b.date)),
    [expenses, periodStart]
  );

  // Compute series and KPIs
  const stats = useMemo(() => {
    const result = {
      costPerLSeries: [],
      cost100Series: [],
      cumulativeSeries: [],
      monthlyMap: {},
      distribution: { fuel: 0, maintenance: 0, repair: 0, other: 0 },
      consumptionSeries: [],
      avgConsumption: 0,
      avgCost100: 0,
      totalAmount: 0,
      kmPerDay: 0,
      lastExpense: null,
      odometerSeries: [],
    };

    let prevKm = null;
    let segFuelAmt = 0;
    let segFuelLiters = 0;
    let cumulative = 0;
    let minKm = Infinity;
    let maxKm = -Infinity;
    let totalFuelAmt = 0;
    let totalFuelLiters = 0;

    filteredExpenses.forEach((exp) => {
      if (!exp.date) return;
      const date = new Date(exp.date);
      const type = exp.type || 'other';
      const amt = Number(exp.amount);
      const liters = Number(exp.liters);
      const km = exp.km != null ? Number(exp.km) : null;

      // Sanitize
      const validAmt = !Number.isNaN(amt) && amt > 0;
      const validLiters = !Number.isNaN(liters) && liters > 0;

      if (validAmt) {
        cumulative += amt;
        result.cumulativeSeries.push({ x: date, y: cumulative });
        result.distribution[type] = (result.distribution[type] || 0) + amt;
        result.totalAmount += amt;

        const mKey = `${date.getFullYear()}-${String(
          date.getMonth() + 1
        ).padStart(2, '0')}`;
        if (!result.monthlyMap[mKey]) {
          result.monthlyMap[mKey] = {
            fuel: 0,
            maintenance: 0,
            repair: 0,
            other: 0,
          };
        }
        result.monthlyMap[mKey][type] += amt;

        if (!result.lastExpense || date > new Date(result.lastExpense.date)) {
          result.lastExpense = { ...exp };
        }
      }

      if (type === 'fuel' && validAmt && validLiters) {
        const pricePerL = amt / liters;
        result.costPerLSeries.push({ x: date, y: Number(pricePerL.toFixed(2)) });
        segFuelAmt += amt;
        segFuelLiters += liters;
        totalFuelAmt += amt;
        totalFuelLiters += liters;
      }

      if (km != null && !Number.isNaN(km)) {
        result.odometerSeries.push({ x: date, y: km });
        minKm = Math.min(minKm, km);
        maxKm = Math.max(maxKm, km);

        if (prevKm != null && km > prevKm) {
          const delta = km - prevKm;
          if (delta > 0) {
            if (segFuelAmt > 0) {
              result.cost100Series.push({
                x: date,
                y: (segFuelAmt * 100) / delta,
              });
            }
            if (segFuelLiters > 0) {
              result.consumptionSeries.push({
                x: date,
                y: (segFuelLiters * 100) / delta,
              });
            }
          }
          segFuelAmt = 0;
          segFuelLiters = 0;
        }
        prevKm = km;
      }
    });

    result.cost100Series = movingAverage(result.cost100Series);
    result.consumptionSeries = movingAverage(result.consumptionSeries);

    const KM = isFinite(minKm) && isFinite(maxKm) && maxKm > minKm ? maxKm - minKm : 0;
    result.avgCost100 = KM > 0 ? (totalFuelAmt * 100) / KM : 0;
    result.avgConsumption = KM > 0 ? (totalFuelLiters * 100) / KM : 0;

    const days = Math.max(1, (Date.now() - periodStart.getTime()) / 86400000);
    result.kmPerDay = KM > 0 ? KM / days : 0;

    // Invariants (±1%)
    const eps = 0.01;
    const inv1 = KM > 0 ? (totalFuelLiters * 100) / KM : 0;
    const inv2 = KM > 0 ? (totalFuelAmt * 100) / KM : 0;
    const inv3 = days > 0 ? KM / days : 0;
    if (inv1 || result.avgConsumption) {
      console.assert(Math.abs(result.avgConsumption - inv1) / (inv1 || 1) < eps);
    }
    if (inv2 || result.avgCost100) {
      console.assert(Math.abs(result.avgCost100 - inv2) / (inv2 || 1) < eps);
    }
    if (inv3 || result.kmPerDay) {
      console.assert(Math.abs(result.kmPerDay - inv3) / (inv3 || 1) < eps);
    }

    return result;
  }, [filteredExpenses, periodStart]);

  const types = ['fuel', 'maintenance', 'repair', 'other'];

  const monthlyCategories = useMemo(
    () => Object.keys(stats.monthlyMap).sort(),
    [stats.monthlyMap]
  );

  const monthlySeries = useMemo(
    () =>
      types.map((t) => ({
        name: t,
        data: monthlyCategories.map((m) => stats.monthlyMap[m]?.[t] || 0),
      })),
    [stats.monthlyMap, monthlyCategories]
  );

  const lineOptions = (unit, color = '#3B82F6', area = true) => ({
    chart: { type: area ? 'area' : 'line', height: 160, toolbar: { show: false } },
    stroke: { curve: 'smooth', width: 3 },
    colors: [color],
    xaxis: { type: 'datetime', labels: { format: 'dd/MM' } },
    yaxis: {
      labels: {
        formatter: (v) => {
          if (unit === '€') return fmtCurrency.format(v);
          if (unit === 'L/100') return `${v.toFixed(2)} L/100km`;
          if (unit === '€/L') return `${v.toFixed(2)} €/L`;
          return fmtInt.format(Math.round(v)) + ' km';
        },
      },
    },
    dataLabels: { enabled: false },
    markers: { size: 0 },
    grid: { strokeDashArray: 4 },
    fill: area
      ? { type: 'gradient', gradient: { opacityFrom: 0.2, opacityTo: 0 } }
      : undefined,
    tooltip: {
      x: { formatter: (v) => fmtDate.format(new Date(v)) },
      y: {
        formatter: (v) => {
          if (unit === '€') return fmtCurrency.format(v);
          if (unit === 'L/100') return `${v.toFixed(2)} L/100km`;
          if (unit === '€/L') return `${v.toFixed(2)} €/L`;
          return fmtInt.format(Math.round(v)) + ' km';
        },
      },
    },
    legend: { show: false },
  });

  if (loading) {
    return (
      <PageTransition>
        <p className="text-center mt-20">Chargement...</p>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <p className="text-center mt-20 text-red-600">{error}</p>
      </PageTransition>
    );
  }

  if (!vehicle) {
    return (
      <PageTransition>
        <p className="text-center mt-20">Véhicule introuvable</p>
      </PageTransition>
    );
  }

  const monthlyOptions = {
    chart: { type: 'bar', stacked: true, toolbar: { show: false }, height: 160 },
    xaxis: {
      categories: monthlyCategories.map((m) => {
        const [y, mo] = m.split('-');
        return `${mo}/${y}`;
      }),
    },
    colors: types.map((t) => typeColors[t]),
    yaxis: { labels: { formatter: (v) => fmtCurrency.format(v) } },
    tooltip: { y: { formatter: (v) => fmtCurrency.format(v) } },
    legend: { show: true },
  };

  const distOptions = {
    labels: types,
    legend: { position: 'bottom' },
    colors: types.map((t) => typeColors[t]),
    tooltip: { y: { formatter: (v) => fmtCurrency.format(v) } },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              formatter: (w) =>
                fmtCurrency.format(
                  w.globals.seriesTotals.reduce((a, b) => a + b, 0)
                ),
            },
          },
        },
      },
    },
  };

  const periodDays = Math.max(
    1,
    (Date.now() - periodStart.getTime()) / 86400000
  );
  const budgetAnnual =
    periodDays >= 300
      ? stats.totalAmount
      : (stats.totalAmount / periodDays) * 365;
  const autonomy =
    stats.avgConsumption > 0 && vehicle.tankSize
      ? Math.round((vehicle.tankSize / stats.avgConsumption) * 100)
      : 0;

  return (
    <PageTransition>
      <div className="space-y-6 px-4 max-w-7xl mx-auto">
        <div className="flex flex-wrap items-center justify-between mt-4">
          <h1 className="text-3xl font-bold">
            {vehicle.name} {vehicle.model}{' '}
            <span className="text-foreground/60">({vehicle.year})</span>
          </h1>
          <div className="flex gap-2 mt-2">
            {[30, 90, 365].map((d) => (
              <button
                key={d}
                className={`px-3 py-1 rounded-full border ${
                  period === d
                    ? 'bg-primary text-white border-primary'
                    : 'text-primary border-primary/30 hover:bg-primary/10'
                }`}
                onClick={() => setPeriod(d)}
              >
                {d} j
              </button>
            ))}
          </div>
        </div>

        {vehicle.image ? (
          <img
            src={`${API_URL}${vehicle.image}`}
            alt={`${vehicle.name} ${vehicle.model}`}
            className="w-full h-64 object-cover rounded-lg"
          />
        ) : null}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 bg-card rounded">
            <p className="text-sm text-foreground/60">Coût / 100 km</p>
            <p className="text-2xl font-bold">
              {fmtCurrency.format(stats.avgCost100 || 0)}
            </p>
            <p className="text-xs mt-1 text-foreground/60">
              moyenne période
            </p>
          </div>
          <div className="p-4 bg-card rounded">
            <p className="text-sm text-foreground/60">Conso moyenne</p>
            <p className="text-2xl font-bold">
              {fmtNumber.format(stats.avgConsumption)} L/100km
            </p>
            <p className="text-xs mt-1 text-foreground/60">
              moyenne période
            </p>
          </div>
          <div className="p-4 bg-card rounded">
            <p className="text-sm text-foreground/60">Budget annuel</p>
            <p className="text-2xl font-bold">
              {fmtCurrency.format(budgetAnnual)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-card p-2 rounded">
            <ReactApexChart
              height={160}
              options={lineOptions('€/L', typeColors.fuel)}
              series={[{ name: '€/L', data: stats.costPerLSeries }]}
            />
          </div>
          <div className="bg-card p-2 rounded">
            <ReactApexChart
              height={160}
              options={lineOptions('€', typeColors.repair)}
              series={[{ name: '€', data: stats.cost100Series }]}
            />
          </div>
          <div className="bg-card p-2 rounded">
            <ReactApexChart
              height={160}
              options={lineOptions('€', typeColors.other)}
              series={[{ name: '€', data: stats.cumulativeSeries, } ]}
            />
          </div>
          <div className="bg-card p-2 rounded">
            <ReactApexChart
              type="bar"
              height={160}
              options={monthlyOptions}
              series={monthlySeries}
            />
          </div>
          <div className="bg-card p-2 rounded">
            <ReactApexChart
              type="donut"
              height={160}
              options={distOptions}
              series={types.map((t) => stats.distribution[t])}
            />
          </div>
          <div className="bg-card p-2 rounded">
            <ReactApexChart
              height={160}
              options={lineOptions('L/100', typeColors.fuel)}
              series={[{ name: 'L/100km', data: stats.consumptionSeries }]}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 bg-card rounded">
            <p className="text-sm text-foreground/60">Dernière dépense</p>
            {stats.lastExpense ? (
              <p className="font-medium">
                {stats.lastExpense.type} - {fmtCurrency.format(stats.lastExpense.amount)} le{' '}
                {fmtDate.format(new Date(stats.lastExpense.date))}
              </p>
            ) : (
              <p>Aucune</p>
            )}
          </div>
          <div className="p-4 bg-card rounded">
            <p className="text-sm text-foreground/60">Km / jour</p>
            <p className="text-2xl font-bold">{fmtNumber.format(stats.kmPerDay)} km</p>
            <p className="text-sm mt-2">
              Autonomie plein : {autonomy ? `${fmtInt.format(autonomy)} km` : 'N/A'}
            </p>
          </div>
        </div>

        <div className="bg-card p-2 rounded">
          <ReactApexChart
            height={160}
            options={lineOptions('km', typeColors.maintenance, false)}
            series={[{ name: 'km', data: stats.odometerSeries }]}
          />
        </div>
      </div>
    </PageTransition>
  );
}

