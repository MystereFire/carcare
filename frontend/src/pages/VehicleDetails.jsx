import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../src/api';
import PageTransition from '../components/PageTransition';
import {
  KmOverTimeChart,
  ExpenseTypeBarChart,
  CumulativeExpenseChart,
  CostPer100KmChart,
  CostPerLiterChart,
  MonthlyExpenseBarChart,
  AverageKmCard,
  AnnualBudgetEstimate,
  AverageConsumptionChart,
  TankRangeCard,
  FullToFullConsumptionChart
} from '../components/Charts';
import { API_URL } from '../../src/config';
import MaintenanceCard from '../components/MaintenanceCard';
import KpiCard from '../components/KpiCard';
import LastExpenseCard from '../components/LastExpenseCard';

export default function VehicleDetails() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [expensesWithAcquisition, setExpensesWithAcquisition] = useState([]);
  const [consumptionSegments, setConsumptionSegments] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [vehRes, expRes, consRes] = await Promise.all([
          api.get(`/api/vehicles/${id}`),
          api.get(`/api/expenses/${id}`, { params: { page: 1, limit: 1000 } }),
          api.get(`/api/stats/vehicle/${id}/consumption`)
        ]);

        const veh = vehRes.data;
        const expensesFromApi = expRes.data.data;

        let withAcquisition = [...expensesFromApi];

        if (veh.acquisitionDate) {
          withAcquisition = [
            ...withAcquisition,
            {
              _id: `acquisition-${veh._id}`,
              type: 'acquisition',
              label: 'Acquisition',
              amount: 0,
              km: veh.initialKm,
              date: veh.acquisitionDate
            }
          ];
        }

        withAcquisition.sort((a, b) => new Date(a.date) - new Date(b.date));

        setVehicle(veh);
        setExpenses(expensesFromApi.sort((a, b) => new Date(a.date) - new Date(b.date)));
        setExpensesWithAcquisition(withAcquisition);
        setConsumptionSegments(consRes.data);
      } catch (err) {
        console.error('Erreur de chargement :', err);
      }
    };

    fetchDetails();
  }, [id]);

  if (!vehicle) return <p className="text-center mt-20">Chargement...</p>;

  const lastExpense = expenses.length ? expenses[expenses.length - 1] : null;

  // KPI calculations
  const fuelExpenses = expenses
    .filter(e => e.type === 'fuel')
    .sort((a, b) => new Date(a.date) - new Date(b.date));

  let costPer100 = 0;
  if (fuelExpenses.length > 1) {
    let totalCost = 0;
    let totalKm = 0;
    for (let i = 1; i < fuelExpenses.length; i++) {
      const kmDiff = fuelExpenses[i].km - fuelExpenses[i - 1].km;
      if (kmDiff > 0) {
        totalCost += parseFloat(fuelExpenses[i].amount || 0);
        totalKm += kmDiff;
      }
    }
    costPer100 = totalKm > 0 ? ((totalCost / totalKm) * 100).toFixed(2) : 0;
  }

  let avgCons = 0;
  const consArray = [];
  for (let i = 1; i < fuelExpenses.length; i++) {
    const kmDiff = fuelExpenses[i].km - fuelExpenses[i - 1].km;
    if (kmDiff > 0 && fuelExpenses[i].liters > 0) {
      consArray.push((fuelExpenses[i].liters / kmDiff) * 100);
    }
  }
  if (consArray.length) {
    avgCons = (consArray.reduce((a, b) => a + b, 0) / consArray.length).toFixed(2);
  }

  let annualBudget = 0;
  const cleaned = expenses.filter(e => e.type !== 'acquisition');
  if (cleaned.length > 1) {
    const sorted = [...cleaned].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstDate = new Date(sorted[0].date);
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const days = (lastDate - firstDate) / 86400000;
    const total = cleaned.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    annualBudget = days > 0 ? (total * (365 / days)).toFixed(2) : total.toFixed(2);
  }

  return (
    <PageTransition>
      <div className="max-w-5xl mx-auto mt-6 px-4 space-y-16">
        {/* Vehicle header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 flex flex-col md:flex-row md:items-center gap-4">
          {vehicle.image && (
            <img
              src={`${API_URL}${vehicle.image}`}
              alt={`Photo du véhicule ${vehicle.name} ${vehicle.model} (${vehicle.year})`}
              className="w-full md:w-1/2 h-56 object-cover rounded-lg"
            />
          )}
          <div className="flex-1 w-full flex flex-col justify-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
                {vehicle.name} {vehicle.model}{' '}
                <span className="text-gray-500">({vehicle.year})</span>
              </h1>
              <p className="text-sm text-gray-500">Km initial : {vehicle.initialKm}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => navigate(`/vehicle/${vehicle._id}/add-expense`)}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-3 py-2"
                aria-label="Ajouter une dépense"
              >
                <span>➕</span>
                <span className="hidden sm:inline">Ajouter une dépense</span>
              </button>
              <button
                onClick={() => navigate(`/vehicle/${vehicle._id}/edit`)}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-3 py-2"
                aria-label="Modifier le véhicule"
              >
                <span>✏️</span>
                <span className="hidden sm:inline">Modifier</span>
              </button>
              <button
                onClick={() => navigate(`/vehicle/${vehicle._id}/maintenance`)}
                className="flex items-center gap-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg px-3 py-2"
                aria-label="Ouvrir le carnet d'entretien"
              >
                <span>🛠️</span>
                <span className="hidden sm:inline">Carnet d'entretien</span>
              </button>
            </div>
          </div>
        </div>

        {/* KPI cards */}
        <div className="grid gap-4 sm:grid-cols-3 auto-rows-fr">
          <KpiCard label="Coût /100 km" value={`${costPer100} €`} colorClass="text-blue-700" bgClass="bg-blue-50" />
          <KpiCard label="Consommation moyenne" value={`${avgCons} L/100km`} colorClass="text-green-700" bgClass="bg-green-50" />
          <KpiCard label="Budget annuel" value={`${annualBudget} €`} colorClass="text-purple-700" bgClass="bg-purple-50" />
        </div>

        {/* Last expense and maintenance */}
        <div className="grid gap-6 md:grid-cols-2 auto-rows-fr">
          <LastExpenseCard expense={lastExpense} onViewAll={() => navigate(`/vehicle/${vehicle._id}/expenses`)} />
          <MaintenanceCard vehicleId={vehicle._id} />
        </div>

        {/* Charts section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 px-4 py-2 bg-gray-50 rounded-2xl shadow-sm">Données carburant / entretien</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            <CostPerLiterChart data={expenses} />
            <CostPer100KmChart data={expenses} />
            <CumulativeExpenseChart data={expenses} />
            <MonthlyExpenseBarChart data={expenses} />
            <ExpenseTypeBarChart data={expenses} />
            <FullToFullConsumptionChart data={consumptionSegments} />
          </div>
        </section>

        {/* Analysis section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 px-4 py-2 bg-gray-50 rounded-2xl shadow-sm">Analyse &amp; prévision</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            <AverageConsumptionChart data={expenses} />
            <TankRangeCard data={expenses} tankSize={vehicle.tankSize} />
            <AnnualBudgetEstimate data={expenses} />
            <AverageKmCard data={expensesWithAcquisition} />
            <KmOverTimeChart data={expensesWithAcquisition} />
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
