import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../src/api';
import PageTransition from '../components/PageTransition';
import { ComparisonBarChart } from '../components/Charts';
import VehicleCard from '../components/compare/VehicleCard';
import WinnerBadge from '../components/compare/WinnerBadge';
import CompareSummary from '../components/compare/CompareSummary';
import VehicleSelect from '../components/compare/VehicleSelect';
import { formatCurrency, formatL100 } from '../lib/formatters';
import { computeBest, computeDiff } from '../lib/compare';
import { API_URL } from '../../src/config';

export default function CompareVehicles() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [firstId, setFirstId] = useState('');
  const [secondId, setSecondId] = useState('');
  const [firstData, setFirstData] = useState(null);
  const [secondData, setSecondData] = useState(null);

  useEffect(() => {
    api
      .get('/api/vehicles', { params: { page: 1, limit: 100 } })
      .then(res => setVehicles(res.data.data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchData(firstId, setFirstData);
  }, [firstId]);

  useEffect(() => {
    fetchData(secondId, setSecondData);
  }, [secondId]);

  const fetchData = async (id, setter) => {
    if (!id) return setter(null);
    try {
      const [vehRes, expRes] = await Promise.all([
        api.get(`/api/vehicles/${id}`),
        api.get(`/api/expenses/${id}`, { params: { page: 1, limit: 1000 } }),
      ]);
      setter({ vehicle: vehRes.data, expenses: expRes.data.data });
    } catch {
      setter(null);
    }
  };

  const computeMetrics = (data) => {
    if (!data) return null;
    const { vehicle, expenses } = data;
    const totalExpense = expenses.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    const fuels = expenses.filter(e => e.type === 'fuel' && e.liters && e.km);
    const sortedFuel = [...fuels].sort((a, b) => new Date(a.date) - new Date(b.date));

    const allKm = expenses
      .filter(e => typeof e.km === 'number')
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const distanceKm = allKm.length >= 2 ? allKm[allKm.length - 1].km - allKm[0].km : 0;

    let avgCons = 0;
    let distance = 0;
    if (sortedFuel.length >= 2) {
      let totalCons = 0;
      let count = 0;
      for (let i = 1; i < sortedFuel.length; i++) {
        const kmDiff = sortedFuel[i].km - sortedFuel[i - 1].km;
        if (kmDiff > 0) {
          const cons = (sortedFuel[i].liters / kmDiff) * 100;
          totalCons += cons;
          count++;
          distance += kmDiff;
        }
      }
      if (count > 0) avgCons = totalCons / count;
    }

    const costPerKm = distance > 0 ? totalExpense / distance : 0;

    return {
      id: vehicle._id,
      name: vehicle.name,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      photoUrl: vehicle.image,
      totals: {
        spendEUR: totalExpense,
        fuelL100: avgCons,
        costPerKm,
        distanceKm,
      },
    };
  };

  const metrics1 = computeMetrics(firstData);
  const metrics2 = computeMetrics(secondData);

  const bestMap = metrics1 && metrics2 ? {
    spendEUR: computeBest([metrics1.totals.spendEUR, metrics2.totals.spendEUR], 'min'),
    fuelL100: computeBest([metrics1.totals.fuelL100, metrics2.totals.fuelL100], 'min'),
    costPerKm: computeBest([metrics1.totals.costPerKm, metrics2.totals.costPerKm], 'min'),
    distanceKm: computeBest([metrics1.totals.distanceKm, metrics2.totals.distanceKm], 'max'),
  } : {};

  let winnerName = null;
  let savingsPercent = null;
  if (metrics1 && metrics2 && bestMap.costPerKm != null) {
    winnerName = bestMap.costPerKm === 0 ? metrics1.name : metrics2.name;
    savingsPercent = computeDiff(metrics1.totals.costPerKm, metrics2.totals.costPerKm).toFixed(0);
  }

  const bestId = bestMap.spendEUR != null ? (bestMap.spendEUR === 0 ? firstId : secondId) : null;

  const summaryRows = metrics1 && metrics2 ? [
    {
      label: 'Dépenses',
      winner: bestMap.spendEUR == null ? 'Égalité' : (bestMap.spendEUR === 0 ? metrics1.name : metrics2.name),
      diffText: bestMap.spendEUR == null ? '' : `-${computeDiff(metrics1.totals.spendEUR, metrics2.totals.spendEUR).toFixed(0)}%`,
    },
    {
      label: 'Consommation',
      winner: bestMap.fuelL100 == null ? 'Égalité' : (bestMap.fuelL100 === 0 ? metrics1.name : metrics2.name),
      diffText: bestMap.fuelL100 == null ? '' : `-${computeDiff(metrics1.totals.fuelL100, metrics2.totals.fuelL100).toFixed(0)}%`,
    },
    {
      label: 'Coût/km',
      winner: bestMap.costPerKm == null ? 'Égalité' : (bestMap.costPerKm === 0 ? metrics1.name : metrics2.name),
      diffText: bestMap.costPerKm == null ? '' : `-${computeDiff(metrics1.totals.costPerKm, metrics2.totals.costPerKm).toFixed(0)}%`,
    },
    {
      label: 'Distance',
      winner: bestMap.distanceKm == null ? 'Égalité' : (bestMap.distanceKm === 0 ? metrics1.name : metrics2.name),
      diffText: bestMap.distanceKm == null ? '' : `+${computeDiff(metrics1.totals.distanceKm, metrics2.totals.distanceKm).toFixed(0)}%`,
    },
  ] : [];

  const options = vehicles.map(v => ({
    id: v._id,
    label: v.name,
    brandLogoUrl: v.image ? `${API_URL}${v.image}` : null,
  }));

  const chartMetrics1 = metrics1 ? {
    name: metrics1.name,
    totalExpense: metrics1.totals.spendEUR,
    distance: metrics1.totals.distanceKm,
    avgConsumption: metrics1.totals.fuelL100,
    costPerKm: metrics1.totals.costPerKm,
  } : null;

  const chartMetrics2 = metrics2 ? {
    name: metrics2.name,
    totalExpense: metrics2.totals.spendEUR,
    distance: metrics2.totals.distanceKm,
    avgConsumption: metrics2.totals.fuelL100,
    costPerKm: metrics2.totals.costPerKm,
  } : null;

  return (
    <PageTransition>
      <div className="bg-gray-100 min-h-screen py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-2 text-center">Comparer deux véhicules</h1>
          <p className="text-center text-gray-600 mb-6">Comparez les performances et coûts de vos véhicules.</p>

          <WinnerBadge winnerName={winnerName} savingsPercent={savingsPercent} />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col">
              <label className="font-medium mb-1">Véhicule A</label>
              <VehicleSelect value={firstId} onChange={setFirstId} options={options} disabledId={secondId} />
            </div>
            <div className="flex flex-col">
              <label className="font-medium mb-1">Véhicule B</label>
              <VehicleSelect value={secondId} onChange={setSecondId} options={options} disabledId={firstId} />
            </div>
          </div>

          {metrics1 && metrics2 && (
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-2">
                <VehicleCard vehicle={metrics1} index={0} bestMap={bestMap} />
                <VehicleCard vehicle={metrics2} index={1} bestMap={bestMap} />
              </div>

              <ComparisonBarChart metrics1={chartMetrics1} metrics2={chartMetrics2} />

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-sm w-full max-w-md mx-auto">
                <h3 className="font-semibold mb-4 text-center">Récapitulatif</h3>
                <CompareSummary rows={summaryRows} />
                {bestId && (
                  <button
                    onClick={() => navigate(`/vehicle/${bestId}`)}
                    className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg"
                  >
                    Voir le véhicule gagnant
                  </button>
                )}
                <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div className="flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${bestMap.fuelL100 === 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>Conso {formatL100(metrics1.totals.fuelL100)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${bestMap.costPerKm === 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>€/km {formatCurrency(metrics1.totals.costPerKm)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`h-2 w-2 rounded-full ${bestMap.spendEUR === 0 ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span>Dép. {formatCurrency(metrics1.totals.spendEUR)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </PageTransition>
  );
}
