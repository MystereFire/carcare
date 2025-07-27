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

  return (
    <PageTransition>
      <div className="max-w-4xl mx-auto mt-10 px-4">
        <h1 className="text-3xl font-bold mb-6">Comparer deux véhicules</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <select
            value={firstId}
            onChange={(e) => setFirstId(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">-- Choisir le premier véhicule --</option>
            {vehicles.map(v => (
              <option key={v._id} value={v._id}>{v.name}</option>
            ))}
          </select>

          <select
            value={secondId}
            onChange={(e) => setSecondId(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="">-- Choisir le second véhicule --</option>
            {vehicles.map(v => (
              <option key={v._id} value={v._id}>{v.name}</option>
            ))}
          </select>
        </div>

        {metrics1 && metrics2 && (
          <div className="grid gap-6 md:grid-cols-2">
            <div className="overflow-x-auto bg-white rounded-lg shadow">
              <table className="min-w-full text-sm divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="p-3" />
                    <th className="p-3 text-left font-semibold">{metrics1.name}</th>
                    <th className="p-3 text-left font-semibold">{metrics2.name}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 font-semibold">Marque</td>
                    <td className="p-2">{metrics1.brand}</td>
                    <td className="p-2">{metrics2.brand}</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 font-semibold">Modèle</td>
                    <td className="p-2">{metrics1.model}</td>
                    <td className="p-2">{metrics2.model}</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 font-semibold">Année</td>
                    <td className="p-2">{metrics1.year}</td>
                    <td className="p-2">{metrics2.year}</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 font-semibold">Dépenses totales (€)</td>
                    <td className="p-2">{metrics1.totalExpense}</td>
                    <td className="p-2">{metrics2.totalExpense}</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 font-semibold">Carburant (€)</td>
                    <td className="p-2">{metrics1.fuelExpense}</td>
                    <td className="p-2">{metrics2.fuelExpense}</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 font-semibold">Maintenance (€)</td>
                    <td className="p-2">{metrics1.maintenanceExpense}</td>
                    <td className="p-2">{metrics2.maintenanceExpense}</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 font-semibold">Réparations (€)</td>
                    <td className="p-2">{metrics1.repairExpense}</td>
                    <td className="p-2">{metrics2.repairExpense}</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 font-semibold">Consommation moyenne (L/100km)</td>
                    <td className="p-2">{metrics1.avgConsumption || 'N/A'}</td>
                    <td className="p-2">{metrics2.avgConsumption || 'N/A'}</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 font-semibold">Coût par km (€)</td>
                    <td className="p-2">{metrics1.costPerKm || 'N/A'}</td>
                    <td className="p-2">{metrics2.costPerKm || 'N/A'}</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 font-semibold">Coût moyen au litre (€)</td>
                    <td className="p-2">{metrics1.avgCostPerLiter || 'N/A'}</td>
                    <td className="p-2">{metrics2.avgCostPerLiter || 'N/A'}</td>
                  </tr>
                  <tr className="odd:bg-white even:bg-gray-50">
                    <td className="p-2 font-semibold">Distance enregistrée (km)</td>
                    <td className="p-2">{metrics1.distance}</td>
                    <td className="p-2">{metrics2.distance}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div>
              <ComparisonBarChart metrics1={metrics1} metrics2={metrics2} />
            </div>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
