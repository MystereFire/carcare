import React, { useEffect, useState } from 'react';
import api from '../../src/api';
import PageTransition from '../components/PageTransition';
import { ComparisonBarChart } from '../components/Charts';

export default function CompareVehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [firstId, setFirstId] = useState('');
  const [secondId, setSecondId] = useState('');
  const [firstData, setFirstData] = useState(null);
  const [secondData, setSecondData] = useState(null);

  useEffect(() => {
    api.get('/api/vehicles').then(res => setVehicles(res.data)).catch(() => {});
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
        api.get(`/api/expenses/${id}`),
      ]);
      setter({ vehicle: vehRes.data, expenses: expRes.data });
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
  if (metrics1 && metrics2 && metrics1.costPerKm && metrics2.costPerKm) {
    better = parseFloat(metrics1.costPerKm) < parseFloat(metrics2.costPerKm)
      ? metrics1.name
      : metrics2.name;
  }

  const cost1 = metrics1?.costPerKm ? parseFloat(metrics1.costPerKm) : null;
  const cost2 = metrics2?.costPerKm ? parseFloat(metrics2.costPerKm) : null;
  const diffThreshold = 0.15; // 15%
  const showDiff1 = cost1 && cost2 && cost1 > cost2 * (1 + diffThreshold);
  const showDiff2 = cost1 && cost2 && cost2 > cost1 * (1 + diffThreshold);

  const compare = (a, b) => {
    if (a == null || b == null) return null;
    if (parseFloat(a) < parseFloat(b)) return 1;
    if (parseFloat(a) > parseFloat(b)) return 2;
    return 0;
  };

  const winners = metrics1 && metrics2 ? {
    costPerKm: compare(metrics1.costPerKm, metrics2.costPerKm),
    avgConsumption: compare(metrics1.avgConsumption, metrics2.avgConsumption),
    repair: compare(metrics1.repairExpense, metrics2.repairExpense),
    totalExpense: compare(metrics1.totalExpense, metrics2.totalExpense),
  } : {};

  const colorClass = (key, which) => {
    const res = winners[key];
    if (res == null || res === 0) return "";
    return res === which ? "text-green-600" : "text-red-600";
  };

  const summary = metrics1 && metrics2 ? [
    { label: "Coût/km", icon: "🚗", winner: winners.costPerKm === 1 ? metrics1.name : winners.costPerKm === 2 ? metrics2.name : "Égalité" },
    { label: "Réparations", icon: "🔧", winner: winners.repair === 1 ? metrics1.name : winners.repair === 2 ? metrics2.name : "Égalité" },
    { label: "Consommation", icon: "⛽", winner: winners.avgConsumption === 1 ? metrics1.name : winners.avgConsumption === 2 ? metrics2.name : "Égalité" },
  ] : [];

  return (
    <PageTransition>
      <div className="bg-gray-100 min-h-screen py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4 text-center">Comparer deux véhicules</h1>
          {better && (
            <div className="text-center mb-6">
              <span className="inline-block bg-green-100 text-green-800 px-4 py-1 rounded-full shadow-sm text-sm animate-pulse">
                ✅ {better} est plus économique
              </span>
            </div>
          )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 justify-items-center">
          <select
            value={firstId}
            onChange={(e) => setFirstId(e.target.value)}
            className="p-2 border rounded w-full max-w-xs"
          >
            <option value="">-- Choisir le premier véhicule --</option>
            {vehicles.map(v => (
              <option key={v._id} value={v._id}>{v.name}</option>
            ))}
          </select>

          <select
            value={secondId}
            onChange={(e) => setSecondId(e.target.value)}
            className="p-2 border rounded w-full max-w-xs"
          >
            <option value="">-- Choisir le second véhicule --</option>
            {vehicles.map(v => (
              <option key={v._id} value={v._id}>{v.name}</option>
            ))}
          </select>
        </div>

        {metrics1 && metrics2 ? (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 justify-center flex-wrap">
              <div className="bg-white p-4 rounded-2xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all space-y-2 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-2">{metrics1.name}</h2>
                <p><span className="font-semibold">Marque :</span> {metrics1.brand}</p>
                <p><span className="font-semibold">🚗 Modèle :</span> {metrics1.model}</p>
                <p><span className="font-semibold">📅 Année :</span> {metrics1.year}</p>
                <h3 className="font-semibold mt-2">💰 Dépenses</h3>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">💶</span> <span className={`font-bold ${colorClass('totalExpense',1)}`}>{metrics1.totalExpense}</span></p>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">⛽</span> {metrics1.fuelExpense}</p>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">🔧</span> {metrics1.maintenanceExpense}</p>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">🛠️</span> {metrics1.repairExpense}</p>
                <h3 className="font-semibold mt-2">⛽ Carburant</h3>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">⚙️</span> <span className={`font-bold ${colorClass('avgConsumption',1)}`}>{metrics1.avgConsumption || 'N/A'}</span></p>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">💵</span> {metrics1.avgCostPerLiter || 'N/A'}</p>
                <h3 className="font-semibold mt-2">🧰 Entretien / Réparation</h3>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">💰</span> <span className={`font-bold ${colorClass('costPerKm',1)}`}>{metrics1.costPerKm || 'N/A'}</span>
                  {showDiff1 && (
                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">plus cher</span>
                  )}
                </p>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">🛣️</span> {metrics1.distance} km</p>
              </div>
              <div className="bg-white p-4 rounded-2xl shadow-md hover:shadow-lg transform hover:scale-105 transition-all space-y-2 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-2">{metrics2.name}</h2>
                <p><span className="font-semibold">Marque :</span> {metrics2.brand}</p>
                <p><span className="font-semibold">🚗 Modèle :</span> {metrics2.model}</p>
                <p><span className="font-semibold">📅 Année :</span> {metrics2.year}</p>
                <h3 className="font-semibold mt-2">💰 Dépenses</h3>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">💶</span> <span className={`font-bold ${colorClass('totalExpense',2)}`}>{metrics2.totalExpense}</span></p>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">⛽</span> {metrics2.fuelExpense}</p>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">🔧</span> {metrics2.maintenanceExpense}</p>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">🛠️</span> {metrics2.repairExpense}</p>
                <h3 className="font-semibold mt-2">⛽ Carburant</h3>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">⚙️</span> <span className={`font-bold ${colorClass('avgConsumption',2)}`}>{metrics2.avgConsumption || 'N/A'}</span></p>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">💵</span> {metrics2.avgCostPerLiter || 'N/A'}</p>
                <h3 className="font-semibold mt-2">🧰 Entretien / Réparation</h3>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">💰</span> <span className={`font-bold ${colorClass('costPerKm',2)}`}>{metrics2.costPerKm || 'N/A'}</span>
                  {showDiff2 && (
                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">plus cher</span>
                  )}
                </p>
                <p className="flex items-center"><span className="bg-gray-100 p-1 rounded-full mr-2">🛣️</span> {metrics2.distance} km</p>
              </div>
            </div>
            <ComparisonBarChart metrics1={metrics1} metrics2={metrics2} />
            <div className="bg-white p-4 rounded-lg shadow mt-4 text-sm w-full max-w-md mx-auto">
              <h3 className="font-semibold mb-2">Récapitulatif</h3>
              <ul className="space-y-1">
                {summary.map(item => (
                  <li key={item.label}>{item.icon} {item.label} : {item.winner}</li>
                ))}
              </ul>
            </div>
          </div>
        ) : null}
        </div>
      </div>
    </PageTransition>
  );
}
