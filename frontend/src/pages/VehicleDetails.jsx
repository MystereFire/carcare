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
const fmtDate = new Intl.DateTimeFormat('fr-FR');

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
    let sumAmt = 0;
    let sumLiters = 0;
    let cumulative = 0;
    let firstKm = null;
    let lastKm = null;
    const costVals = [];
    const consoVals = [];

    filteredExpenses.forEach((exp) => {
      const date = new Date(exp.date);
      const type = exp.type || 'other';
      const amt = Number(exp.amount) || 0;
      const liters = Number(exp.liters) || 0;

      cumulative += amt;
      result.cumulativeSeries.push({ x: date, y: cumulative });
      result.distribution[type] = (result.distribution[type] || 0) + amt;
      result.totalAmount += amt;

      const mKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!result.monthlyMap[mKey]) {
        result.monthlyMap[mKey] = { fuel: 0, maintenance: 0, repair: 0, other: 0 };
      }
      result.monthlyMap[mKey][type] += amt;

      if (!result.lastExpense || date > new Date(result.lastExpense.date)) {
        result.lastExpense = exp;
      }

      if (type === 'fuel' && liters > 0 && amt > 0) {
        const pricePerL = amt / liters;
        result.costPerLSeries.push({ x: date, y: Number(pricePerL.toFixed(2)) });
        sumLiters += liters;
      }

      sumAmt += amt;

      if (exp.km != null) {
        const km = Number(exp.km);
        result.odometerSeries.push({ x: date, y: km });

        if (prevKm != null && km > prevKm) {
          const delta = km - prevKm;
          const cost100 = (sumAmt / delta) * 100;
          result.cost100Series.push({ x: date, y: Number(cost100.toFixed(2)) });
          costVals.push(cost100);

          if (sumLiters > 0) {
            const conso = (sumLiters / delta) * 100;
            result.consumptionSeries.push({ x: date, y: Number(conso.toFixed(2)) });
            consoVals.push(conso);
          }

          sumAmt = 0;
          sumLiters = 0;
        }

        if (firstKm == null) firstKm = km;
        lastKm = km;
        prevKm = km;
      }
    });

    result.avgCost100 = costVals.length
      ? costVals.reduce((a, b) => a + b, 0) / costVals.length
      : 0;
    result.avgConsumption = consoVals.length
      ? consoVals.reduce((a, b) => a + b, 0) / consoVals.length
      : 0;

    const days = Math.max(1, (Date.now() - periodStart.getTime()) / 86400000);
    if (firstKm != null && lastKm != null && lastKm > firstKm) {
      result.kmPerDay = (lastKm - firstKm) / days;
    }

    return result;
  }, [filteredExpenses, periodStart]);

  const monthlyCategories = useMemo(
    () => Object.keys(stats.monthlyMap).sort(),
    [stats.monthlyMap]
  );

  const monthlySeries = useMemo(
    () =>
      ['fuel', 'maintenance', 'repair', 'other'].map((t) => ({
        name: t,
        data: monthlyCategories.map((m) => stats.monthlyMap[m]?.[t] || 0),
      })),
    [stats.monthlyMap, monthlyCategories]
  );

  const lineOptions = (unit) => ({
    chart: { type: 'line', height: 160, toolbar: { show: false } },
    stroke: { curve: 'smooth' },
    xaxis: { type: 'datetime' },
    yaxis: {
      labels: {
        formatter: (v) => {
          if (unit === '€') return fmtCurrency.format(v);
          if (unit === 'L/100') return `${v.toFixed(2)} L/100km`;
          if (unit === '€/L') return `${v.toFixed(2)} €/L`;
          return `${v.toFixed(0)} km`;
        },
      },
    },
    dataLabels: { enabled: false },
    markers: { size: 0 },
    grid: { strokeDashArray: 4 },
    tooltip: {
      x: { formatter: (v) => fmtDate.format(new Date(v)) },
      y: {
        formatter: (v) => {
          if (unit === '€') return fmtCurrency.format(v);
          if (unit === 'L/100') return `${v.toFixed(2)} L/100km`;
          if (unit === '€/L') return `${v.toFixed(2)} €/L`;
          return `${v.toFixed(0)} km`;
        },
      },
    },
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
    yaxis: { labels: { formatter: (v) => fmtCurrency.format(v) } },
    tooltip: { y: { formatter: (v) => fmtCurrency.format(v) } },
  };

  const distOptions = {
    labels: ['fuel', 'maintenance', 'repair', 'other'],
    legend: { position: 'bottom' },
    tooltip: { y: { formatter: (v) => fmtCurrency.format(v) } },
  };

  const budgetAnnual =
    (stats.totalAmount /
      ((Date.now() - periodStart.getTime()) / 86400000)) *
    365;
  const autonomy =
    stats.avgConsumption > 0 && vehicle.tankSize
      ? Math.round((vehicle.tankSize / stats.avgConsumption) * 100)
      : 0;

  return (
    <PageTransition>
      <div className="space-y-6 px-4 max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between mt-4">
          <h1 className="text-3xl font-bold">
            {vehicle.name} {vehicle.model}{' '}
            <span className="text-foreground/60">({vehicle.year})</span>
          </h1>
          <div className="flex gap-2 mt-2">
            {[30, 90, 365].map((d) => (
              <button
                key={d}
                className={`px-3 py-1 rounded ${
                  period === d ? 'bg-primary text-white' : 'bg-muted'
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
            <p className="text-sm text-foreground/60">Conso moyenne</p>
            <p className="text-2xl font-bold">
              {stats.avgConsumption.toFixed(2)} L/100km
            </p>
          </div>
          <div className="p-4 bg-card rounded">
            <p className="text-sm text-foreground/60">Coût /100km</p>
            <p className="text-2xl font-bold">
              {fmtCurrency.format(stats.avgCost100 || 0)}
            </p>
          </div>
          <div className="p-4 bg-card rounded">
            <p className="text-sm text-foreground/60">Budget annuel</p>
            <p className="text-2xl font-bold">{fmtCurrency.format(budgetAnnual)}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-card p-2 rounded">
            <ReactApexChart
              type="line"
              height={160}
              options={lineOptions('€/L')}
              series={[{ name: '€/L', data: stats.costPerLSeries }]}
            />
          </div>
          <div className="bg-card p-2 rounded">
            <ReactApexChart
              type="line"
              height={160}
              options={lineOptions('€')}
              series={[{ name: '€', data: stats.cost100Series }]}
            />
          </div>
          <div className="bg-card p-2 rounded">
            <ReactApexChart
              type="line"
              height={160}
              options={lineOptions('€')}
              series={[{ name: '€', data: stats.cumulativeSeries }]}
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
              series={Object.values(stats.distribution)}
            />
          </div>
          <div className="bg-card p-2 rounded">
            <ReactApexChart
              type="line"
              height={160}
              options={lineOptions('km')}
              series={[{ name: 'km', data: stats.odometerSeries }]}
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
            <p className="text-sm text-foreground/60">Kilomètres / jour</p>
            <p className="text-2xl font-bold">{stats.kmPerDay.toFixed(1)} km</p>
            <p className="text-sm mt-2">
              Autonomie plein : {autonomy ? `${autonomy} km` : 'N/A'}
            </p>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}

