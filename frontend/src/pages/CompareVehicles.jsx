import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../src/api';
import PageTransition from '../components/PageTransition';
import { ComparisonBarChart } from '../components/Charts';
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

    const fuelExpense = expenses
      .filter(e => e.type === 'fuel')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const maintenanceExpense = expenses
      .filter(e => e.type === 'maintenance')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const repairExpense = expenses
      .filter(e => e.type === 'repair')
      .reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);

    const fuels = expenses.filter(e => e.type === 'fuel' && e.liters && e.km);
    const sortedFuel = [...fuels].sort((a, b) => new Date(a.date) - new Date(b.date));

    const allKm = expenses
      .filter(e => typeof e.km === 'number')
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const distanceKm =
      allKm.length >= 2 ? allKm[allKm.length - 1].km - allKm[0].km : 0;

    const totalLiters = fuels.reduce((sum, e) => sum + (parseFloat(e.liters) || 0), 0);

    let avgCons = null;
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
      if (count > 0) avgCons = (totalCons / count).toFixed(2);
    }

    const costPerKm = distance > 0 ? (totalExpense / distance).toFixed(2) : null;
    const avgCostPerLiter = totalLiters > 0 ? (fuelExpense / totalLiters).toFixed(2) : null;

    return {
      name: vehicle.name,
      brand: vehicle.brand,
      model: vehicle.model,
      year: vehicle.year,
      image: vehicle.image,
      totalExpense: totalExpense.toFixed(2),
      fuelExpense: fuelExpense.toFixed(2),
      maintenanceExpense: maintenanceExpense.toFixed(2),
      repairExpense: repairExpense.toFixed(2),
      avgConsumption: avgCons,
      costPerKm,
      distance: distanceKm,
      avgCostPerLiter,
    };
  };

  const metrics1 = computeMetrics(firstData);
  const metrics2 = computeMetrics(secondData);

  let better;
  let diffPercent;
  let bestTotalId;
  if (metrics1 && metrics2) {
    if (metrics1.costPerKm && metrics2.costPerKm) {
      const c1 = parseFloat(metrics1.costPerKm);
      const c2 = parseFloat(metrics2.costPerKm);
      if (c1 !== c2) {
        better = c1 < c2 ? metrics1.name : metrics2.name;
        diffPercent = Math.abs(c2 - c1) / Math.max(c1, c2) * 100;
        diffPercent = diffPercent.toFixed(0);
      }
    }
    bestTotalId = parseFloat(metrics1.totalExpense) <= parseFloat(metrics2.totalExpense) ? firstId : secondId;
  }

  const cost1 = metrics1?.costPerKm ? parseFloat(metrics1.costPerKm) : null;
  const cost2 = metrics2?.costPerKm ? parseFloat(metrics2.costPerKm) : null;

  const compare = (a, b) => {
    if (a == null || b == null) return 'Égalité';
    const pa = parseFloat(a);
    const pb = parseFloat(b);
    if (pa < pb) return metrics1.name;
    if (pa > pb) return metrics2.name;
    return 'Égalité';
  };

  const summary = metrics1 && metrics2 ? [
    { label: 'Dépenses', icon: '💶', winner: compare(metrics1.totalExpense, metrics2.totalExpense) },
    { label: 'Consommation', icon: '⛽', winner: compare(metrics1.avgConsumption, metrics2.avgConsumption) },
    { label: 'Coût/km', icon: '🚗', winner: compare(metrics1.costPerKm, metrics2.costPerKm) },
  ] : [];

  const diffBadge = (a, b, color) => {
    if (a == null || b == null) return null;
    const pa = parseFloat(a);
    const pb = parseFloat(b);
    const cls = color === 'blue' ? 'text-blue-600' : 'text-emerald-600';
    if (pa > pb) return <span className={`ml-2 text-xs ${cls}`}>↑ plus cher</span>;
    if (pa < pb) return <span className={`ml-2 text-xs ${cls}`}>↓ moins cher</span>;
    return null;
  };

  const VehicleCard = ({ metrics, compareTo, color }) => {
    if (!metrics) return null;
    const titleColor = color === 'blue' ? 'text-blue-600' : 'text-emerald-600';
    const imgSrc = metrics.image ? `${API_URL}${metrics.image}` : 'https://via.placeholder.com/150';
    const alt = `Photo ${metrics.brand} ${metrics.model}`;
    return (
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-2 flex flex-col">
        <img src={imgSrc} alt={alt} className="w-full h-32 object-cover rounded-md" />
        <h2 className={`text-xl font-semibold mb-1 ${titleColor}`}>{metrics.name}</h2>
        <p><span className="font-semibold">Marque :</span> {metrics.brand}</p>
        <p><span className="font-semibold">Modèle :</span> {metrics.model}</p>
        <p><span className="font-semibold">Année :</span> {metrics.year}</p>
        <h3 className="font-semibold mt-2">Dépenses</h3>
        <p className="flex items-center"><span className="mr-2">💶</span><span className="font-bold">{metrics.totalExpense}</span>{diffBadge(metrics.totalExpense, compareTo.totalExpense, color)}</p>
        <p className="flex items-center"><span className="mr-2">⛽</span>{metrics.fuelExpense}</p>
        <p className="flex items-center"><span className="mr-2">🔧</span>{metrics.maintenanceExpense}</p>
        <p className="flex items-center"><span className="mr-2">🛠️</span>{metrics.repairExpense}</p>
        <h3 className="font-semibold mt-2">Carburant</h3>
        <p className="flex items-center"><span className="mr-2">⚙️</span><span className="font-bold">{metrics.avgConsumption || 'N/A'}</span>{diffBadge(metrics.avgConsumption, compareTo.avgConsumption, color)}</p>
        <p className="flex items-center"><span className="mr-2">💵</span>{metrics.avgCostPerLiter || 'N/A'}</p>
        <h3 className="font-semibold mt-2">Coût</h3>
        <p className="flex items-center"><span className="mr-2">💰</span><span className="font-bold">{metrics.costPerKm || 'N/A'}</span>{diffBadge(metrics.costPerKm, compareTo.costPerKm, color)}</p>
        <p className="flex items-center"><span className="mr-2">🛣️</span>{metrics.distance} km</p>
      </div>
    );
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-5xl mx-auto">
          <h1 className="text-3xl font-bold text-center">Comparer deux véhicules</h1>
          <p className="text-center text-gray-600">Comparez les performances et coûts de vos véhicules.</p>
          {better && (
            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-4 py-1 rounded-full shadow-sm text-sm">
                <span>✅</span>
                <span>Véhicule {better} est plus économique (−{diffPercent}%)</span>
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="flex flex-col">
              <label htmlFor="vehA" className="font-medium mb-1">Véhicule A</label>
              <select
                id="vehA"
                aria-label="Sélectionner véhicule A"
                value={firstId}
                onChange={(e) => setFirstId(e.target.value)}
                className="p-2 border rounded w-full"
              >
                <option value="">-- Choisir le véhicule --</option>
                {vehicles.map(v => (
                  <option key={v._id} value={v._id}>{v.name}</option>
                ))}
              </select>
            </div>
            <div className="flex flex-col">
              <label htmlFor="vehB" className="font-medium mb-1">Véhicule B</label>
              <select
                id="vehB"
                aria-label="Sélectionner véhicule B"
                value={secondId}
                onChange={(e) => setSecondId(e.target.value)}
                className="p-2 border rounded w-full"
              >
                <option value="">-- Choisir le véhicule --</option>
                {vehicles.map(v => (
                  <option key={v._id} value={v._id}>{v.name}</option>
                ))}
              </select>
            </div>
          </div>

          {metrics1 && metrics2 && (
            <div className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <VehicleCard metrics={metrics1} compareTo={metrics2} color="blue" />
                <VehicleCard metrics={metrics2} compareTo={metrics1} color="emerald" />
              </div>
              <ComparisonBarChart metrics1={metrics1} metrics2={metrics2} />
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-sm w-full max-w-md mx-auto">
                <h3 className="font-semibold mb-4 text-center">Récapitulatif</h3>
                <ul className="space-y-2">
                  {summary.map(item => (
                    <li key={item.label} className="flex justify-between">
                      <span className="flex items-center gap-2">{item.icon} {item.label}</span>
                      <span className="font-medium">{item.winner}</span>
                    </li>
                  ))}
                </ul>
                {bestTotalId && (
                  <button
                    onClick={() => navigate(`/vehicle/${bestTotalId}`)}
                    className="mt-4 w-full bg-indigo-500 hover:bg-indigo-600 text-white py-2 rounded-lg"
                    aria-label="Voir le véhicule gagnant"
                  >
                    Voir le véhicule gagnant
                  </button>
                )}
              </div>
            </div>
          )}
      </div>
    </PageTransition>
  );
}
