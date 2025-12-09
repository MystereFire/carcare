
import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../src/api';
import PageTransition from '../components/PageTransition';
import { API_URL } from '../../src/config';
import { formatDate, formatEuro, formatNumber } from '../lib/formatters';
import AddExpense from './AddExpense';

const typeBadges = {
  fuel: { label: 'Carburant', bg: 'bg-blue-100', text: 'text-blue-600' },
  maintenance: { label: 'Entretien', bg: 'bg-amber-100', text: 'text-amber-700' },
  repair: { label: 'Réparation', bg: 'bg-red-100', text: 'text-red-600' },
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [loadingExpenses, setLoadingExpenses] = useState(false);
  const [error, setError] = useState('');
  const [expensesError, setExpensesError] = useState('');
  const [selectedId, setSelectedId] = useState(
    () => localStorage.getItem('currentVehicleId') || ''
  );
  const [expenses, setExpenses] = useState([]);
  const [showExpenseModal, setShowExpenseModal] = useState(false);

  useEffect(() => {
    document.title = 'CarCare - Tableau de bord';
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoadingVehicles(true);
      setError('');
      try {
        const res = await api.get('/api/vehicles', { params: { page: 1, limit: 100 } });
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setVehicles(list);
      } catch (err) {
        console.error('Erreur chargement véhicules :', err);
        setError('Erreur lors du chargement des véhicules');
      } finally {
        setLoadingVehicles(false);
      }
    };

    fetchVehicles();
  }, []);

  useEffect(() => {
    if (!vehicles.length) return;
    const exists = vehicles.some((veh) => veh._id === selectedId);
    const nextId = exists ? selectedId : vehicles[0]._id;
    if (nextId && nextId !== selectedId) {
      setSelectedId(nextId);
      localStorage.setItem('currentVehicleId', nextId);
    }
  }, [vehicles, selectedId]);

  useEffect(() => {
    const loadExpenses = async (vehicleId) => {
      if (!vehicleId) {
        setExpenses([]);
        return;
      }
      setLoadingExpenses(true);
      setExpensesError('');
      try {
        const res = await api.get(`/api/expenses/${vehicleId}`, {
          params: { page: 1, limit: 200 },
        });
        const list = Array.isArray(res.data?.data) ? res.data.data : [];
        setExpenses(list);
      } catch (err) {
        console.error('Erreur chargement dépenses :', err);
        setExpensesError('Impossible de récupérer les dépenses récentes.');
        setExpenses([]);
      } finally {
        setLoadingExpenses(false);
      }
    };

    loadExpenses(selectedId);
  }, [selectedId]);
  const selectedVehicle = useMemo(
    () => vehicles.find((veh) => veh._id === selectedId) || null,
    [vehicles, selectedId]
  );

  const currentKm = useMemo(() => {
    if (!selectedVehicle) return 0;
    const km = selectedVehicle.currentOdometer ?? selectedVehicle.initialKm ?? 0;
    return Number.isFinite(km) ? km : 0;
  }, [selectedVehicle]);

  const kmDelta = useMemo(() => {
    if (!selectedVehicle) return 0;
    const initial = selectedVehicle.initialKm ?? 0;
    const current = selectedVehicle.currentOdometer ?? initial;
    return Math.max(0, current - initial);
  }, [selectedVehicle]);

  const totals = useMemo(() => {
    if (!expenses.length) {
      return {
        total: 0,
        monthly: 0,
        byType: { fuel: 0, maintenance: 0, repair: 0 },
      };
    }
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const byType = expenses.reduce(
      (acc, exp) => {
        const amount = Number(exp.amount) || 0;
        if (exp.type && acc[exp.type] != null) acc[exp.type] += amount;
        return acc;
      },
      { fuel: 0, maintenance: 0, repair: 0 }
    );
    const total = expenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    const monthly = expenses
      .filter((exp) => exp.date && new Date(exp.date) >= startMonth)
      .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
    return { total, monthly, byType };
  }, [expenses]);

  const monthlySeries = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 2; i >= 0; i -= 1) {
      const d = new Date(now);
      d.setMonth(now.getMonth() - i);
      const label = d.toLocaleString('fr-FR', { month: 'short' });
      const total = expenses
        .filter((exp) => {
          if (!exp.date) return false;
          const date = new Date(exp.date);
          return date.getMonth() === d.getMonth() && date.getFullYear() === d.getFullYear();
        })
        .reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
      months.push({ label, total });
    }
    return months;
  }, [expenses]);

  const recentExpenses = useMemo(
    () =>
      [...expenses]
        .filter((e) => e.date)
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5),
    [expenses]
  );

  const isSingleVehicle = vehicles.length === 1;
  const currentMonthLabel = useMemo(
    () => new Date().toLocaleString('fr-FR', { month: 'long' }),
    []
  );
  const fuelExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.type === 'fuel' && e.km != null && e.liters != null)
      .sort((a, b) => (Number(a.km) || 0) - (Number(b.km) || 0));
  }, [expenses]);

  const litersPer100Km = useMemo(() => {
    if (fuelExpenses.length < 2) return 0;

    // Find all indices of Full Fills
    const fullFillIndices = fuelExpenses
      .map((e, i) => (e.isFullFill ? i : -1))
      .filter((i) => i !== -1);

    let startIndex = 0;
    let endIndex = fuelExpenses.length - 1;

    // Logic: "Base on last 3 full tanks"
    // We need at least 2 full tanks to form a closed interval.
    if (fullFillIndices.length >= 2) {
      // Take the last 3 full tank indices (or 2 if only 2 exist)
      const recentIndices = fullFillIndices.slice(-3);
      startIndex = recentIndices[0];
      endIndex = recentIndices[recentIndices.length - 1];
    } else {
      // Fallback: If not enough regular full tanks, we try to use the whole history
      // strictly if we can't find better, to show *something* rather than 0.
      startIndex = 0;
      endIndex = fuelExpenses.length - 1;
    }

    const startExp = fuelExpenses[startIndex];
    const endExp = fuelExpenses[endIndex];

    // Distance between start (tank full) and end (tank full)
    const distance = (Number(endExp.km) || 0) - (Number(startExp.km) || 0);

    // Sum liters strictly between Start (excl) and End (incl)
    // + any liters in the End expense itself.
    const consumedLiters = fuelExpenses
      .slice(startIndex + 1, endIndex + 1)
      .reduce((sum, e) => sum + (Number(e.liters) || 0), 0);

    if (distance <= 0 || !isFinite(distance)) return 0;
    return (consumedLiters * 100) / distance;
  }, [fuelExpenses]);

  const avgAutonomy = useMemo(() => {
    if (!litersPer100Km) return 0;
    const tank = Number(selectedVehicle?.tankSize) || 0;
    if (tank) {
      return (tank * 100) / litersPer100Km;
    }
    // Fallback: Moyenne des distances entre pleins
    if (fuelExpenses.length < 2) return 0;
    const minKm = Number(fuelExpenses[0].km) || 0;
    const maxKm = Number(fuelExpenses[fuelExpenses.length - 1].km) || 0;
    const distance = maxKm - minKm;
    return distance / (fuelExpenses.length - 1);
  }, [litersPer100Km, selectedVehicle, fuelExpenses]);

  const inspectionDateLabel = useMemo(() => {
    if (!selectedVehicle?.technicalInspectionDate) return null;
    return formatDate(selectedVehicle.technicalInspectionDate);
  }, [selectedVehicle]);

  const handleSelect = (id) => {
    localStorage.setItem('currentVehicleId', id);
    setSelectedId(id);
  };

  const handleAddVehicle = () => navigate('/add-vehicle');
  const handleAddExpense = () => {
    if (!selectedId) return;
    setShowExpenseModal(true);
  };

  const handleCompare = () => navigate('/compare');
  const handleProfile = () => navigate('/profile');
  const handleAddVehicleFromProfile = () => navigate('/add-vehicle');
  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const donutSegments = useMemo(() => {
    const total = Object.values(totals.byType || {}).reduce((sum, v) => sum + v, 0);
    if (!total) return { background: 'radial-gradient(circle, #fff 55%, #e2e8f0 56%)' };
    let acc = 0;
    const parts = Object.entries(totals.byType).map(([key, value]) => {
      const start = acc;
      const percent = (value / total) * 100;
      acc += percent;
      const color =
        key === 'fuel'
          ? '#3b82f6'
          : key === 'maintenance'
            ? '#f59e0b'
            : '#ef4444';
      return `${color} ${start}% ${acc}%`;
    });
    return {
      background: `conic-gradient(${parts.join(', ')})`,
    };
  }, [totals.byType]);



  const vehicleImage = selectedVehicle?.image
    ? `${API_URL}${selectedVehicle.image}`
    : '/car-placeholder.svg';

  const renderTypeBadge = (type) => {
    const style = typeBadges[type] || { label: 'Divers', bg: 'bg-slate-100', text: 'text-slate-600' };
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold',
          style.bg,
          style.text
        )}
      >
        <span className="w-2 h-2 rounded-full bg-current" />
        {style.label}
      </span>
    );
  };
  return (
    <>
      <PageTransition>
        <div className="min-h-[calc(100vh-64px)] bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800">
          <div className="flex">
            <aside className="hidden lg:flex w-72 flex-col m-4 rounded-3xl bg-white/80 backdrop-blur-xl border border-white/50 shadow-2xl sticky top-4 h-[calc(100vh-2rem)]">
              <div className="p-8 flex items-center gap-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-blue-500/30">
                  C
                </div>
                <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">CarCare</span>
              </div>
              <nav className="flex-1 px-4 space-y-2 mt-2">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-blue-50/80 text-blue-700 font-semibold shadow-sm ring-1 ring-blue-100"
                  onClick={() => navigate('/')}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                    />
                  </svg>
                  Tableau de bord
                </button>
                <button
                  onClick={handleAddExpense}
                  className="hidden w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-md transition-all duration-200 font-medium"
                  disabled={!selectedId}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
                  </svg>
                  Ajouter une dépense
                </button>
                <button
                  onClick={() => selectedId && navigate(`/vehicle/${selectedId}/maintenance`)}
                  disabled={!selectedId}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-md transition-all duration-200 font-medium disabled:opacity-50"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M6.938 19h10.124c1.54 0 2.502-1.667 1.732-3L13.732 5c-.77-1.333-2.694-1.333-3.464 0L5.206 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  Entretien
                </button>
                {!isSingleVehicle && (
                  <button
                    onClick={handleCompare}
                    className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-md transition-all duration-200 font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 10h10M4 14h16M4 18h10" />
                    </svg>
                    Comparer
                  </button>
                )}
                <button
                  onClick={handleProfile}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-slate-500 hover:bg-white hover:text-slate-900 hover:shadow-md transition-all duration-200 font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M5.121 17.804A9 9 0 1118.364 4.56 9 9 0 015.12 17.804z"
                    />
                  </svg>
                  Mon compte
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-red-500 hover:bg-red-50 hover:text-red-600 transition-all duration-200 font-medium mt-auto"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"
                    />
                  </svg>
                  Déconnexion
                </button>
              </nav>
              {!isSingleVehicle && (
                <div className="p-4 mt-auto">
                  <button
                    onClick={handleAddVehicleFromProfile}
                    className="w-full inline-flex items-center justify-center px-4 py-3 rounded-xl border-2 border-dashed border-blue-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 transition-all duration-200 font-semibold"
                  >
                    + Ajouter un véhicule
                  </button>
                </div>
              )}
            </aside>

            <div className="flex-1 flex flex-col h-[calc(100vh-2rem)] overflow-y-auto scrollbar-hide">
              <header className="px-8 py-6 flex flex-col md:flex-row md:items-center md:justify-between sticky top-0 z-10 bg-white/80 backdrop-blur-md border-b border-white/20 mb-6 rounded-b-3xl lg:rounded-none lg:bg-transparent lg:border-none lg:backdrop-blur-none lg:static">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                    {selectedVehicle ? (
                      <>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700">
                          {selectedVehicle.name ||
                            `${selectedVehicle.brand || ''} ${selectedVehicle.model || ''}`}
                        </span>
                        {selectedVehicle.year ? (
                          <span className="text-sm font-medium text-slate-500 bg-white/50 px-3 py-1 rounded-full border border-slate-200/50 shadow-sm backdrop-blur-sm">
                            {selectedVehicle.year}
                          </span>
                        ) : null}
                      </>
                    ) : (
                      'Tableau de bord'
                    )}
                  </h1>
                  <p className="text-sm text-slate-500 mt-2 flex flex-wrap gap-3 items-center font-medium">
                    {selectedVehicle?.plate ? <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">Immat: {selectedVehicle.plate}</span> : null}
                    {selectedVehicle?.brand || selectedVehicle?.model ? (
                      <span className="flex items-center gap-2">
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <span>
                          {selectedVehicle?.brand} {selectedVehicle?.model}
                        </span>
                      </span>
                    ) : null}
                    {selectedVehicle?.technicalInspectionDate ? (
                      <>
                        <span className="hidden sm:inline text-slate-300">•</span>
                        <span
                          title={inspectionDateLabel ? `Expiration CT : ${inspectionDateLabel}` : undefined}
                          className={clsx(
                            "px-2 py-0.5 rounded border",
                            new Date(selectedVehicle.technicalInspectionDate) < new Date() ? "bg-red-50 text-red-600 border-red-100" : "bg-green-50 text-green-600 border-green-100"
                          )}
                        >
                          CT: {inspectionDateLabel}
                        </span>
                      </>
                    ) : null}
                  </p>
                </div>
                <div className="flex gap-3 mt-4 md:mt-0">

                  <button
                    onClick={handleAddExpense}
                    disabled={!selectedId}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2.5 rounded-xl flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
                    </svg>
                    Ajouter dépense
                  </button>
                </div>
              </header>

              <div className="px-8 pb-8 space-y-8">
                {error && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50/80 backdrop-blur-sm px-6 py-4 text-amber-800 shadow-sm flex items-center gap-3">
                    <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    {error}
                  </div>
                )}

                {loadingVehicles ? (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="h-72 rounded-3xl bg-white/50 border border-white/60 shadow-lg animate-pulse"
                      />
                    ))}
                  </div>
                ) : vehicles.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center bg-white/60 backdrop-blur-xl border border-white/50 rounded-3xl shadow-xl">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 text-blue-600 flex items-center justify-center mb-6 shadow-inner">
                      <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                      </svg>
                    </div>
                    <p className="text-xl font-bold text-slate-900">Ajoutez votre premier véhicule</p>
                    <p className="text-slate-500 mt-3 max-w-md leading-relaxed">
                      Commencez par créer un véhicule pour retrouver le tableau de bord détaillé, vos
                      dépenses et l’historique d’entretien.
                    </p>
                    <button
                      onClick={handleAddVehicle}
                      className="mt-8 inline-flex items-center rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-white hover:shadow-lg hover:shadow-blue-500/30 transition-all transform hover:-translate-y-1 font-semibold"
                    >
                      + Ajouter un véhicule
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="glass p-8 rounded-3xl col-span-2 flex flex-col sm:flex-row justify-between relative overflow-hidden group card-hover">
                        <div className="z-10 flex flex-col justify-between h-full space-y-8">
                          <div>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                              Kilométrage actuel
                            </p>
                            <p className="text-6xl font-black text-slate-900 tracking-tighter">
                              {formatNumber(currentKm)}
                              <span className="text-2xl text-slate-400 font-medium ml-2">km</span>
                            </p>
                            <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 border border-green-100 text-sm font-semibold">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                              </svg>
                              +{formatNumber(kmDelta)} km suivis
                            </div>
                          </div>
                          <div className="flex flex-wrap gap-3">
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 shadow-sm">
                              <span className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                              Contrôle Tech. OK
                            </span>
                            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-slate-50 text-slate-600 border border-slate-200 shadow-sm">
                              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                              Entretien à venir
                            </span>
                          </div>
                        </div>
                        <div className="relative w-full sm:w-80 mt-8 sm:mt-0 flex items-center justify-center">
                          <div className="absolute w-64 h-64 bg-gradient-to-r from-blue-200 to-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob" />
                          <div className="absolute w-64 h-64 bg-gradient-to-r from-purple-200 to-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000" style={{ top: '-20px', right: '-20px' }} />
                          <img
                            src={vehicleImage}
                            alt={selectedVehicle?.name || 'Véhicule'}
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
                                {currentMonthLabel}
                              </p>
                              <p className="text-5xl font-bold tracking-tight">{formatEuro(totals.monthly || 0)}</p>
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
                              <span>Conso moyenne</span>
                              <span className="font-bold text-white">
                                {formatNumber(litersPer100Km || 0)} L/100km
                              </span>
                            </div>
                            <div className="w-full bg-black/20 rounded-full h-3 backdrop-blur-sm overflow-hidden">
                              <div
                                className="bg-white h-full rounded-full shadow-[0_0_15px_rgba(255,255,255,0.6)] transition-all duration-1000 ease-out relative"
                                style={{
                                  width: litersPer100Km
                                    ? `${Math.min(100, Math.max(10, (litersPer100Km / 15) * 100))}%`
                                    : '0%',
                                }}
                              >
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent w-full h-full animate-[shimmer_2s_infinite]"></div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-white/90 bg-white/10 backdrop-blur-md p-3 rounded-xl border border-white/10">
                            <svg className="w-4 h-4 text-blue-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                            Autonomie moyenne : {formatNumber(avgAutonomy)} km
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                      <div className="glass p-8 rounded-3xl col-span-2 card-hover">
                        <div className="flex justify-between items-center mb-8">
                          <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" /></svg>
                            Évolution des dépenses
                          </h3>
                          <div className="flex bg-slate-100/80 p-1 rounded-xl">
                            <span className="px-4 py-1.5 text-xs font-bold bg-white shadow-sm text-slate-800 rounded-lg transition">
                              3 derniers mois
                            </span>
                          </div>
                        </div>
                        <div className="h-64 w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={monthlySeries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                              <XAxis
                                dataKey="label"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }}
                                dy={10}
                              />
                              <Tooltip
                                formatter={(value) => [formatEuro(value), 'Dépenses']}
                                contentStyle={{
                                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                  borderRadius: '12px',
                                  border: 'none',
                                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                }}
                                itemStyle={{ color: '#1e293b', fontWeight: 'bold' }}
                                labelStyle={{ color: '#64748b', marginBottom: '4px' }}
                                cursor={{ stroke: '#3b82f6', strokeWidth: 2 }}
                              />
                              <Area
                                type="monotone"
                                dataKey="total"
                                stroke="#3b82f6"
                                strokeWidth={3}
                                fillOpacity={1}
                                fill="url(#colorTotal)"
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="glass p-8 rounded-3xl flex flex-col items-center justify-center card-hover">
                        <h3 className="font-bold text-xl text-slate-900 w-full mb-6 flex items-center gap-2">
                          <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
                          Répartition
                        </h3>
                        <div className="relative w-56 h-56">
                          <div className="w-full h-full rounded-full shadow-xl ring-4 ring-white/50" style={donutSegments} />
                          <div className="absolute inset-6 bg-white/90 backdrop-blur-sm rounded-full flex flex-col items-center justify-center shadow-inner">
                            <span className="text-3xl font-black text-slate-900 tracking-tight">
                              {formatNumber(totals.total || 0)}
                            </span>
                            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-widest mt-1">
                              Total suivi
                            </span>
                          </div>
                        </div>
                        <div className="mt-8 w-full space-y-4">
                          {[
                            { key: 'fuel', color: 'bg-blue-500', label: 'Carburant' },
                            { key: 'maintenance', color: 'bg-amber-500', label: 'Entretien' },
                            { key: 'repair', color: 'bg-red-500', label: 'Réparation' },
                          ].map((item) => (
                            <div key={item.key} className="flex justify-between items-center text-sm p-2 rounded-lg hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <span className={clsx('w-3 h-3 rounded-full ring-2 ring-white shadow-sm', item.color)} />
                                <span className="text-slate-600 font-medium">{item.label}</span>
                              </div>
                              <span className="font-bold text-slate-900 bg-slate-100 px-2 py-1 rounded-md text-xs">
                                {totals.total
                                  ? `${Math.round(((totals.byType[item.key] || 0) / totals.total) * 100)}%`
                                  : '—'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="glass rounded-3xl overflow-hidden shadow-lg border border-white/40">
                      <div className="p-8 border-b border-slate-100/50 flex justify-between items-center bg-white/40 backdrop-blur-sm">
                        <h3 className="font-bold text-xl text-slate-900 flex items-center gap-2">
                          <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                          Historique récent
                        </h3>
                        <button
                          onClick={() => selectedId && navigate(`/vehicle/${selectedId}/expenses`)}
                          className="text-blue-600 text-sm font-bold hover:text-blue-700 hover:underline disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                          disabled={!selectedId}
                        >
                          Voir tout
                        </button>
                      </div>
                      {expensesError ? (
                        <div className="p-8 text-sm text-amber-700 bg-amber-50/50 border-t border-amber-100">
                          {expensesError}
                        </div>
                      ) : loadingExpenses ? (
                        <div className="p-8 animate-pulse text-slate-500">Chargement des dépenses...</div>
                      ) : recentExpenses.length === 0 ? (
                        <div className="p-12 text-center">
                          <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                          </div>
                          <p className="text-slate-500 font-medium">Aucune dépense pour le moment.</p>
                        </div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-slate-50/50 text-slate-500 uppercase tracking-wider text-xs font-bold border-b border-slate-100">
                              <tr>
                                <th className="px-8 py-5">Type</th>
                                <th className="px-8 py-5">Date</th>
                                <th className="px-8 py-5">Libellé</th>
                                <th className="px-8 py-5">Km / Notes</th>
                                <th className="px-8 py-5 text-right">Montant</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100/50">
                              {recentExpenses.map((exp) => (
                                <tr key={exp._id} className="hover:bg-blue-50/30 transition-colors group cursor-default">
                                  <td className="px-8 py-5">{renderTypeBadge(exp.type)}</td>
                                  <td className="px-8 py-5 text-slate-500 font-medium">
                                    {exp.date ? formatDate(exp.date) : '—'}
                                  </td>
                                  <td className="px-8 py-5 font-semibold text-slate-700 group-hover:text-blue-700 transition-colors">
                                    {exp.label || 'Dépense'}
                                  </td>
                                  <td className="px-8 py-5 text-slate-500">
                                    {exp.km ? <span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">{formatNumber(exp.km)} km</span> : <span className="italic text-slate-400">{exp.notes || '—'}</span>}
                                  </td>
                                  <td className="px-8 py-5 text-right font-bold text-slate-800">
                                    - {formatEuro(Number(exp.amount) || 0)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                    {!isSingleVehicle && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between px-2">
                          <div>
                            <p className="text-xs uppercase tracking-wider text-slate-400 font-bold mb-1">
                              Mes véhicules
                            </p>
                            <h3 className="text-2xl font-bold text-slate-900">Sélection rapide</h3>
                          </div>
                          <button
                            onClick={handleAddVehicle}
                            className="text-blue-600 text-sm font-bold hover:text-blue-700 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all"
                          >
                            + Ajouter
                          </button>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                          {vehicles.map((veh) => {
                            const imgSrc = veh.image ? `${API_URL}${veh.image}` : '/car-placeholder.svg';
                            const isSelected = selectedId === veh._id;
                            return (
                              <button
                                key={veh._id}
                                onClick={() => handleSelect(veh._id)}
                                className={clsx(
                                  'group relative overflow-hidden rounded-3xl text-left transition-all duration-300 border focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/30',
                                  isSelected
                                    ? 'ring-4 ring-blue-500/20 border-blue-500 shadow-xl shadow-blue-500/10 scale-[1.02]'
                                    : 'bg-white border-white/60 hover:shadow-xl hover:-translate-y-1 hover:border-blue-200'
                                )}
                              >
                                <div className="relative h-48 overflow-hidden">
                                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent z-10 opacity-90" />
                                  <img
                                    src={imgSrc}
                                    alt={`Image de ${veh.brand} ${veh.model}`}
                                    loading="lazy"
                                    className="absolute inset-0 h-full w-full object-cover transform transition-transform duration-700 group-hover:scale-110"
                                    onError={(e) => {
                                      e.currentTarget.onerror = null;
                                      e.currentTarget.src = '/car-placeholder.svg';
                                    }}
                                  />
                                  <div className="absolute bottom-0 left-0 p-5 z-20">
                                    <h4 className="text-white font-bold text-lg leading-tight">
                                      {veh.name || `${veh.brand} ${veh.model}`}
                                    </h4>
                                    <p className="text-slate-300 text-xs font-medium mt-1">
                                      {veh.plate || 'Sans immat'} • {veh.year || 'Année ?'}
                                    </p>
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          {showExpenseModal && (
            <AddExpense vehicleId={selectedId} onClose={() => { setShowExpenseModal(false); window.location.reload(); }} />
          )}
        </div>
      </PageTransition>
    </>
  );
}
