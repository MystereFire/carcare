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

  return (
    <PageTransition>
      <div className="bg-gray-100 min-h-screen py-10">
        <div className="max-w-5xl mx-auto px-4">
          <h1 className="text-3xl font-bold mb-4 text-center">Comparer deux véhicules</h1>
          {better && (
            <div className="text-center mb-6">
              <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                🚀 {better} est plus économique
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
            <div className="grid gap-6 md:grid-cols-2 justify-items-center">
              <div className="bg-white p-4 rounded-lg shadow space-y-2 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-2">{metrics1.name}</h2>
                <p><span className="font-semibold">Marque :</span> {metrics1.brand}</p>
                <p><span className="font-semibold">🚗 Modèle :</span> {metrics1.model}</p>
                <p><span className="font-semibold">📅 Année :</span> {metrics1.year}</p>
                <p><span className="font-semibold">💶 Dépenses totales :</span> {metrics1.totalExpense}</p>
                <p><span className="font-semibold">⛽ Carburant :</span> {metrics1.fuelExpense}</p>
                <p><span className="font-semibold">🔧 Maintenance :</span> {metrics1.maintenanceExpense}</p>
                <p><span className="font-semibold">🛠️ Réparations :</span> {metrics1.repairExpense}</p>
                <p><span className="font-semibold">⚙️ Consommation (L/100km) :</span> {metrics1.avgConsumption || 'N/A'}</p>
                <p><span className="font-semibold">💰 Coût par km :</span> {metrics1.costPerKm || 'N/A'}
                  {showDiff1 && (
                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">plus cher</span>
                  )}
                </p>
                <p><span className="font-semibold">💵 Coût moyen au litre :</span> {metrics1.avgCostPerLiter || 'N/A'}</p>
                <p><span className="font-semibold">🛣️ Distance enregistrée :</span> {metrics1.distance} km</p>
              </div>
              <div className="bg-white p-4 rounded-lg shadow space-y-2 w-full max-w-md">
                <h2 className="text-xl font-semibold mb-2">{metrics2.name}</h2>
                <p><span className="font-semibold">Marque :</span> {metrics2.brand}</p>
                <p><span className="font-semibold">🚗 Modèle :</span> {metrics2.model}</p>
                <p><span className="font-semibold">📅 Année :</span> {metrics2.year}</p>
                <p><span className="font-semibold">💶 Dépenses totales :</span> {metrics2.totalExpense}</p>
                <p><span className="font-semibold">⛽ Carburant :</span> {metrics2.fuelExpense}</p>
                <p><span className="font-semibold">🔧 Maintenance :</span> {metrics2.maintenanceExpense}</p>
                <p><span className="font-semibold">🛠️ Réparations :</span> {metrics2.repairExpense}</p>
                <p><span className="font-semibold">⚙️ Consommation (L/100km) :</span> {metrics2.avgConsumption || 'N/A'}</p>
                <p><span className="font-semibold">💰 Coût par km :</span> {metrics2.costPerKm || 'N/A'}
                  {showDiff2 && (
                    <span className="ml-2 text-xs bg-red-100 text-red-800 px-2 py-0.5 rounded-full">plus cher</span>
                  )}
                </p>
                <p><span className="font-semibold">💵 Coût moyen au litre :</span> {metrics2.avgCostPerLiter || 'N/A'}</p>
                <p><span className="font-semibold">🛣️ Distance enregistrée :</span> {metrics2.distance} km</p>
              </div>
            </div>
            <ComparisonBarChart metrics1={metrics1} metrics2={metrics2} />
          </div>
        ) : null}
        </div>
      </div>
    </PageTransition>
  );
}
