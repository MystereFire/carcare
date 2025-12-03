import React, { useEffect, useMemo, useState } from 'react';
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
import { useToast } from '../components/ToastProvider';
import { StatTile } from '../components/ui/StatTile';
import {
  Plus,
  Pencil,
  Wrench,
  Gauge,
  Euro,
  Droplet,
  PiggyBank,
} from '../components/icons';
import PeriodSelector from '../components/PeriodSelector';
import { annotateConsumptionSegments } from '../../src/lib/consumption';
import { formatEuro, formatNumber } from '../../src/lib/formatters';

export default function VehicleDetails() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [expenses, setExpenses] = useState([]);
  const [expensesWithAcquisition, setExpensesWithAcquisition] = useState([]);
  const [period, setPeriod] = useState(90);
  const [deleting, setDeleting] = useState(false);
  const navigate = useNavigate();
  const { addToast } = useToast();

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [vehRes, expRes] = await Promise.all([
          api.get(`/api/vehicles/${id}`),
          api.get(`/api/expenses/${id}`, { params: { page: 1, limit: 1000 } })
        ]);

        const veh = vehRes.data;
        const expensesFromApi = Array.isArray(expRes.data?.data)
          ? expRes.data.data
          : [];

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
        setExpenses([...expensesFromApi].sort((a, b) => new Date(a.date) - new Date(b.date)));
        setExpensesWithAcquisition(withAcquisition);
      } catch (err) {
        console.error('Erreur de chargement :', err);
      }
    };

    fetchDetails();
  }, [id]);
  const lastExpense = expenses.length ? expenses[expenses.length - 1] : null;

  const segments = useMemo(() => {
    const fuel = expenses
      .filter(e => e.type === 'fuel' && e.liters > 0 && e.km != null)
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    const res = [];
    let lastFull = null;
    let liters = 0;
    let price = 0;
    for (const exp of fuel) {
      liters += parseFloat(exp.liters) || 0;
      price += parseFloat(exp.amount) || 0;

      if (exp.isFullFill) {
        if (lastFull && exp.km > lastFull.km && liters > 0) {
          const km = exp.km - lastFull.km;
          res.push({
            startDate: lastFull.date,
            endDate: exp.date,
            km,
            liters,
            price,
            consumption: (liters * 100) / km,
            costPer100: (price * 100) / km,
          });
        }
        lastFull = exp;
        liters = 0;
        price = 0;
      }
    }
    return annotateConsumptionSegments(res);
  }, [expenses]);

  const filteredExpenses = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - period);
    return expenses.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });
  }, [expenses, period]);

  const filteredExpensesWithAcquisition = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - period);
    return expensesWithAcquisition.filter(e => {
      const d = new Date(e.date);
      return d >= start && d <= end;
    });
  }, [expensesWithAcquisition, period]);

  const filteredSegments = useMemo(() => {
    const end = new Date();
    const start = new Date();
    start.setDate(end.getDate() - period);
    return segments.filter(seg => {
      const d = new Date(seg.endDate);
      return d >= start && d <= end;
    });
  }, [segments, period]);

  const safeSegments = useMemo(
    () => filteredSegments.filter(seg => !seg.isSuspect),
    [filteredSegments]
  );

  const suspectSegments = useMemo(
    () => filteredSegments.filter(seg => seg.isSuspect),
    [filteredSegments]
  );

  const handleOdometerUpdate = async () => {
    const km = prompt('Entrez le kilometrage actuel', vehicle.currentOdometer || '');
    if (km !== null && km !== '') {
      const kmNumber = parseInt(km, 10);
      if (!isNaN(kmNumber)) {
        try {
          await api.put(`/api/vehicles/${vehicle._id}`, { currentOdometer: kmNumber });
          setVehicle(v => ({ ...v, currentOdometer: kmNumber }));
        } catch (err) {
          console.error('Erreur lors de la mise a jour du kilometrage', err);
        }
      }
    }
  };

  const handleDeleteVehicle = async () => {
    if (!vehicle) return;
    const confirmDelete = window.confirm('Supprimer ce vehicule ? Les depenses et maintenances associees seront supprimees.');
    if (!confirmDelete) {
      return;
    }
    setDeleting(true);
    try {
      await api.delete(`/api/vehicles/${vehicle._id}`);
      addToast('Vehicule supprime');
      localStorage.removeItem('currentVehicleId');
      navigate('/');
    } catch (err) {
      console.error('Erreur suppression vehicule :', err);
      addToast('Erreur lors de la suppression du vehicule', 'error');
    } finally {
      setDeleting(false);
    }
  };

  const totalKm = safeSegments.reduce((s, seg) => s + seg.km, 0);
  const totalLiters = safeSegments.reduce((s, seg) => s + seg.liters, 0);
  const totalCost = safeSegments.reduce((s, seg) => s + seg.price, 0);
  const costPer100 = totalKm > 0 ? (totalCost * 100) / totalKm : 0;
  const avgCons = totalKm > 0 ? (totalLiters * 100) / totalKm : 0;

  let annualBudget = 0;
  const cleaned = filteredExpenses.filter(e => e.type !== 'acquisition');
  if (cleaned.length > 1) {
    const sorted = [...cleaned].sort((a, b) => new Date(a.date) - new Date(b.date));
    const firstDate = new Date(sorted[0].date);
    const lastDate = new Date(sorted[sorted.length - 1].date);
    const days = (lastDate - firstDate) / 86400000;
    const total = cleaned.reduce((sum, e) => sum + parseFloat(e.amount), 0);
    annualBudget = days > 0 ? total * (365 / days) : total;
  }

  if (!vehicle) {
    return <p className="text-center mt-20">Chargement...</p>;
  }

  const imgSrc = vehicle.image ? `${API_URL}${vehicle.image}` : '/car-placeholder.svg';
  const currentKm = vehicle.currentOdometer ?? vehicle.initialKm ?? 0;
  const monthlyAmount = filteredExpenses.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
  const currentMonthLabel = new Date().toLocaleString('fr-FR', { month: 'long' });
  const inspectionDate = vehicle.technicalInspectionDate
    ? new Date(vehicle.technicalInspectionDate).toLocaleDateString('fr-FR')
    : null;

  const handleInspectionUpdate = async () => {
    const value = window.prompt('Date du contrôle technique (YYYY-MM-DD)', inspectionDate || '');
    if (!value) return;
    try {
      const updated = await api.put(`/api/vehicles/${vehicle._id}`, {
        technicalInspectionDate: value,
      });
      setVehicle((v) => ({ ...v, technicalInspectionDate: updated.data.technicalInspectionDate || value }));
    } catch (err) {
      console.error('Erreur mise à jour contrôle technique', err);
      addToast && addToast('Erreur mise à jour CT', 'error');
    }
  };

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 space-y-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="glass p-8 rounded-3xl col-span-2 flex flex-col md:flex-row justify-between relative overflow-hidden group card-hover">
              <div className="z-10 flex flex-col justify-between h-full space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/')} className="p-2 rounded-full hover:bg-slate-100/50 transition-colors text-slate-500">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                    </button>
                    <p className="text-xs uppercase tracking-wider text-slate-500 font-bold">Détails du véhicule</p>
                  </div>
                  <h1 className="text-4xl font-black text-slate-900 tracking-tight">
                    {vehicle.name || `${vehicle.brand || ''} ${vehicle.model || ''}`}
                    {vehicle.year ? (
                      <span className="ml-3 text-lg font-medium text-slate-500 bg-white/50 px-3 py-1 rounded-full border border-slate-200/50 backdrop-blur-sm align-middle">
                        {vehicle.year}
                      </span>
                    ) : null}
                  </h1>
                  <div className="flex flex-wrap gap-3 text-sm font-medium text-slate-600">
                    {vehicle.plate && <span className="px-3 py-1 bg-white/60 rounded-lg border border-slate-200/60 shadow-sm">Immat: {vehicle.plate}</span>}
                    {vehicle.brand || vehicle.model ? <span className="px-3 py-1 bg-white/60 rounded-lg border border-slate-200/60 shadow-sm">{vehicle.brand} {vehicle.model}</span> : null}
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50/80 border border-blue-100 text-blue-700 font-bold shadow-sm">
                      <Gauge className="w-4 h-4" />
                      {formatNumber(currentKm)} km
                    </span>
                    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-green-50/80 border border-green-100 text-green-700 font-bold shadow-sm">
                      Initial: {formatNumber(vehicle.initialKm || 0)} km
                    </span>
                    {inspectionDate && (
                      <span className={clsx("inline-flex items-center gap-2 px-4 py-1.5 rounded-full border font-bold shadow-sm",
                        new Date(vehicle.technicalInspectionDate) < new Date() ? "bg-red-50/80 border-red-100 text-red-700" : "bg-amber-50/80 border-amber-100 text-amber-700"
                      )}>
                        CT: {inspectionDate}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap gap-3 pt-2">
                  <button
                    onClick={() => navigate(`/vehicle/${vehicle._id}/add-expense`)}
                    className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-5 py-2.5 shadow-lg shadow-blue-500/30 hover:shadow-blue-500/40 hover:-translate-y-0.5 transition-all text-sm font-bold"
                  >
                    <Plus className="h-5 w-5" />
                    Ajouter dépense
                  </button>
                  <button
                    onClick={() => navigate(`/vehicle/${vehicle._id}/edit`)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white hover:shadow-md transition-all"
                  >
                    <Pencil className="h-4 w-4" />
                    Modifier
                  </button>
                  <button
                    onClick={() => navigate(`/vehicle/${vehicle._id}/maintenance`)}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white hover:shadow-md transition-all"
                  >
                    <Wrench className="h-4 w-4" />
                    Entretien
                  </button>
                  <button
                    onClick={handleInspectionUpdate}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white hover:shadow-md transition-all"
                  >
                    CT
                  </button>
                  <button
                    onClick={handleOdometerUpdate}
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/50 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-white hover:shadow-md transition-all"
                  >
                    <Gauge className="h-4 w-4" />
                    Relevé km
                  </button>
                  <button
                    onClick={handleDeleteVehicle}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-100 bg-red-50/50 px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-100 hover:shadow-md transition-all disabled:opacity-50 ml-auto"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
              <div className="relative w-full md:w-80 mt-8 md:mt-0 flex items-center justify-center">
                <div className="absolute w-64 h-64 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob" />
                <div className="absolute w-64 h-64 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-blob animation-delay-2000" style={{ top: '-20px', right: '-20px' }} />
                <img
                  src={imgSrc}
                  alt={`Photo du vehicule ${vehicle.name || vehicle.model || ''}`}
                  className="relative object-contain w-full h-auto drop-shadow-2xl transform transition-transform duration-700 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.onerror = null;
                    e.currentTarget.src = '/car-placeholder.svg';
                  }}
                />
              </div>
            </div>

            <div className="premium-gradient rounded-3xl p-8 text-white flex flex-col justify-between shadow-2xl shadow-indigo-500/20 relative overflow-hidden card-hover group">
              <div className="absolute -top-24 -right-24 w-64 h-64 bg-white opacity-10 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-black/20 to-transparent" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                  <div>
                    <p className="text-white/80 text-sm font-medium mb-1 flex items-center gap-2">
                      <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      Dépenses ({currentMonthLabel})
                    </p>
                    <p className="text-5xl font-bold tracking-tight">{formatEuro(monthlyAmount || 0)}</p>
                  </div>
                  <div className="bg-white/20 backdrop-blur-md p-3 rounded-2xl shadow-inner border border-white/10">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="relative z-10 space-y-6">
                <div>
                  <div className="flex justify-between text-sm text-blue-50 mb-2 font-medium">
                    <span>Consommation moyenne</span>
                    <span className="font-bold text-white">{formatNumber(avgCons || 0)} L/100km</span>
                  </div>
                  <div className="w-full bg-black/20 rounded-full h-3 backdrop-blur-sm overflow-hidden">
                    <div
                      className="bg-white h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all duration-1000 ease-out relative"
                      style={{
                        width: avgCons ? `${Math.min(100, Math.max(10, (avgCons / 15) * 100))}%` : '25%',
                      }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-xs text-white/90 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                  <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Suivi mis à jour automatiquement
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center mb-8 gap-4 border-b border-slate-200/60 pb-6">
            <div>
              <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Vue d'ensemble</h2>
              <p className="text-slate-500 mt-1 font-medium">Analysez les performances et coûts de votre véhicule</p>
            </div>
            <PeriodSelector period={period} onChange={setPeriod} />
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            <StatTile
              title="Coût / 100 km"
              value={formatEuro(costPer100)}
              icon={<Euro className="h-6 w-6 text-blue-600" />}
              className="glass bg-blue-50/40 hover:bg-blue-50/60 transition-all duration-300 card-hover border-blue-100/50"
            />
            <StatTile
              title="Conso. moyenne"
              value={`${formatNumber(avgCons)} L/100km`}
              icon={<Droplet className="h-6 w-6 text-green-600" />}
              className="glass bg-green-50/40 hover:bg-green-50/60 transition-all duration-300 card-hover border-green-100/50"
            />
            <StatTile
              title="Budget annuel (est.)"
              value={formatEuro(annualBudget)}
              icon={<PiggyBank className="h-6 w-6 text-amber-600" />}
              className="glass bg-amber-50/40 hover:bg-amber-50/60 transition-all duration-300 card-hover border-amber-100/50"
            />
          </div>

          <div className="grid gap-8 md:grid-cols-3 auto-rows-fr">
            <div className="glass rounded-3xl p-1 card-hover h-full">
              <LastExpenseCard expense={lastExpense} onViewAll={() => navigate(`/vehicle/${vehicle._id}/expenses`)} className="bg-transparent shadow-none border-none" />
            </div>
            <div className="glass rounded-3xl p-1 card-hover h-full">
              <MaintenanceCard vehicleId={vehicle._id} className="bg-transparent shadow-none border-none" />
            </div>
            <div className="glass rounded-3xl p-1 card-hover h-full">
              <LastFuelPriceCard expenses={filteredExpenses} className="bg-transparent shadow-none border-none" />
            </div>
          </div>

          <section className="mb-16 space-y-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
                <Droplet className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Données carburant / entretien</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
              <div className="glass rounded-3xl p-6 card-hover"><CostPerLiterChart data={filteredExpenses} className="bg-transparent shadow-none border-none" /></div>
              <div className="glass rounded-3xl p-6 card-hover"><CostPer100KmChart data={safeSegments} className="bg-transparent shadow-none border-none" /></div>
              <div className="glass rounded-3xl p-6 card-hover"><CumulativeExpenseChart data={filteredExpenses} className="bg-transparent shadow-none border-none" /></div>
              <div className="glass rounded-3xl p-6 card-hover"><MonthlyExpenseBarChart data={filteredExpenses} className="bg-transparent shadow-none border-none" /></div>
              <div className="glass rounded-3xl p-6 card-hover"><ExpenseTypeBarChart data={filteredExpenses} className="bg-transparent shadow-none border-none" /></div>
              <div className="glass rounded-3xl p-6 card-hover"><FuelConsumptionChart data={safeSegments} className="bg-transparent shadow-none border-none" /></div>
            </div>
          </section>

          <section className="mb-16 space-y-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 text-purple-600 rounded-xl">
                <Gauge className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Analyse &amp; prévision</h2>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 auto-rows-fr">
              <div className="glass rounded-3xl p-6 card-hover"><AverageConsumptionChart data={safeSegments} className="bg-transparent shadow-none border-none" /></div>
              <div className="glass rounded-3xl p-6 card-hover"><TankRangeCard data={safeSegments} tankSize={vehicle.tankSize} className="bg-transparent shadow-none border-none" /></div>
              <div className="glass rounded-3xl p-6 card-hover"><AnnualBudgetEstimate data={filteredExpenses} className="bg-transparent shadow-none border-none" /></div>
              <div className="glass rounded-3xl p-6 card-hover"><AverageKmCard data={filteredExpensesWithAcquisition} className="bg-transparent shadow-none border-none" /></div>
              <div className="glass rounded-3xl p-6 card-hover"><KmOverTimeChart data={filteredExpensesWithAcquisition} className="bg-transparent shadow-none border-none" /></div>
            </div>
          </section>
        </div>
      </div>
    </PageTransition>
  );
}
