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
  FuelConsumptionChart
} from '../components/Charts';
import { API_URL } from '../../src/config';
import MaintenanceCard from '../components/MaintenanceCard';
import LastExpenseCard from '../components/LastExpenseCard';
import LastFuelPriceCard from '../components/LastFuelPriceCard';
import { StatTile } from '../components/ui/StatTile';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  Plus,
  Pencil,
  Wrench,
  Gauge,
  Euro,
  Droplet,
  PiggyBank,
} from 'lucide-react';

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

  const handleOdometerUpdate = async () => {
    const km = prompt('Entrez le kilométrage actuel', vehicle.currentOdometer || '');
    if (km !== null && km !== '') {
      const kmNumber = parseInt(km, 10);
      if (!isNaN(kmNumber)) {
        try {
          await api.put(`/api/vehicles/${vehicle._id}`, { currentOdometer: kmNumber });
          setVehicle(v => ({ ...v, currentOdometer: kmNumber }));
        } catch (err) {
          console.error('Erreur lors de la mise à jour du kilométrage', err);
        }
      }
    }
  };

  // KPI calculations
  let costPer100 = 0;
  let avgCons = 0;
  if (consumptionSegments.length) {
    const totalKm = consumptionSegments.reduce((s, seg) => s + seg.km, 0);
    const totalLiters = consumptionSegments.reduce((s, seg) => s + seg.liters, 0);
    const totalCost = consumptionSegments.reduce((s, seg) => s + seg.price, 0);
    costPer100 = totalKm > 0 ? ((totalCost * 100) / totalKm).toFixed(2) : 0;
    avgCons = totalKm > 0 ? ((totalLiters * 100) / totalKm).toFixed(2) : 0;
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
        <Card className="flex flex-col md:flex-row md:items-center gap-4 p-4">
          {vehicle.image && (
            <img
              src={`${API_URL}${vehicle.image}`}
              alt={`Photo du véhicule ${vehicle.name} ${vehicle.model} (${vehicle.year})`}
              className="w-full md:w-1/2 h-56 object-cover rounded-lg"
            />
          )}
          <div className="flex-1 w-full flex flex-col justify-center gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold">
                {vehicle.name} {vehicle.model}{' '}
                <span className="text-foreground/60">({vehicle.year})</span>
              </h1>
              <p className="text-sm text-foreground/60">Km initial : {vehicle.initialKm}</p>
              <p className="text-sm text-foreground/60">Km actuel : {vehicle.currentOdometer}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => navigate(`/vehicle/${vehicle._id}/add-expense`)}
                aria-label="Ajouter une dépense"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Ajouter une dépense</span>
              </Button>
              <Button
                onClick={() => navigate(`/vehicle/${vehicle._id}/edit`)}
                aria-label="Modifier le véhicule"
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                <span className="hidden sm:inline">Modifier</span>
              </Button>
              <Button
                onClick={() => navigate(`/vehicle/${vehicle._id}/maintenance`)}
                aria-label="Ouvrir le carnet d'entretien"
                className="gap-2"
              >
                <Wrench className="h-4 w-4" />
                <span className="hidden sm:inline">Carnet d'entretien</span>
              </Button>
              <Button
                onClick={handleOdometerUpdate}
                aria-label="Relever le kilométrage"
                className="gap-2"
              >
                <Gauge className="h-4 w-4" />
                <span className="hidden sm:inline">Relevé kilométrique</span>
              </Button>
            </div>
          </div>
        </Card>

        {/* KPI tiles */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile
            title="Coût /100 km"
            value={`${costPer100} €`}
            icon={<Euro className="h-5 w-5" />}
            className="bg-blue-50 dark:bg-blue-950"
          />
          <StatTile
            title="Consommation moyenne"
            value={`${avgCons} L/100km`}
            icon={<Droplet className="h-5 w-5" />}
            className="bg-green-50 dark:bg-green-950"
          />
          <StatTile
            title="Budget annuel"
            value={`${annualBudget} €`}
            icon={<PiggyBank className="h-5 w-5" />}
            className="bg-amber-50 dark:bg-amber-950"
          />
        </div>

        {/* Last expense, maintenance, and last fuel price */}
        <div className="grid gap-6 md:grid-cols-3 auto-rows-fr">
          <LastExpenseCard expense={lastExpense} onViewAll={() => navigate(`/vehicle/${vehicle._id}/expenses`)} />
          <MaintenanceCard vehicleId={vehicle._id} />
          <LastFuelPriceCard expenses={expenses} />
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
            <FuelConsumptionChart data={consumptionSegments} />
          </div>
        </section>

        {/* Analysis section */}
        <section className="mb-12">
          <h2 className="text-2xl font-semibold mb-6 px-4 py-2 bg-gray-50 rounded-2xl shadow-sm">Analyse &amp; prévision</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
            <AverageConsumptionChart data={consumptionSegments} />
            <TankRangeCard data={consumptionSegments} tankSize={vehicle.tankSize} />
            <AnnualBudgetEstimate data={expenses} />
            <AverageKmCard data={expensesWithAcquisition} />
            <KmOverTimeChart data={expensesWithAcquisition} />
          </div>
        </section>
      </div>
    </PageTransition>
  );
}
