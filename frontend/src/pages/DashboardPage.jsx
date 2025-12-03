import React, { useEffect, useState } from 'react';
import api from '../../src/api';
import PageTransition from '../components/PageTransition';
import { formatEuro, formatNumber } from '../lib/formatters';

const VEHICLE_ID = '60c72b2f9a7d3c001c8f4b01';

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      setError('');
      try {
        const res = await api.get(`/api/dashboard/${VEHICLE_ID}`);
        setDashboardData(res.data);
      } catch (err) {
        console.error('Erreur dashboard', err);
        setError("Impossible de charger le tableau de bord");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center text-slate-600">
          Chargement des données...
        </div>
      </PageTransition>
    );
  }

  if (error) {
    return (
      <PageTransition>
        <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        </div>
      </PageTransition>
    );
  }

  const vehicle = dashboardData?.vehicle || {};
  const kpis = dashboardData?.kpis?.last90Days || {};
  const distribution = dashboardData?.distribution?.annualByType || [];
  const evolution = dashboardData?.evolution?.monthly || [];
  const maintenance = dashboardData?.maintenance || null;
  const recentExpenses = dashboardData?.recentExpenses || [];

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 text-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-10">
          <header className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Tableau de bord</p>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                {vehicle.name || `${vehicle.brand || ''} ${vehicle.model || ''}`}
                {vehicle.year && (
                  <span className="text-sm font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                    {vehicle.year}
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-500 mt-1">
                {vehicle.plate ? `Immat: ${vehicle.plate} • ` : ''}
                Km actuel: {formatNumber(vehicle.currentOdometer || vehicle.initialKm || 0)}
              </p>
            </div>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold mb-4">KPIs (90 jours)</p>
              <div className="grid sm:grid-cols-3 gap-4">
                <StatCard label="Montant" value={formatEuro(kpis.totalAmount || 0)} />
                <StatCard label="Litres" value={`${formatNumber(kpis.totalLiters || 0)} L`} />
                <StatCard label="Km" value={`${formatNumber(kpis.totalKm || 0)} km`} />
                <StatCard label="Coût /100km" value={formatEuro(kpis.costPer100Km || 0)} />
                <StatCard label="L/100km" value={`${formatNumber(kpis.litersPer100Km || 0)} L/100km`} />
              </div>
            </div>

            <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-6 text-white flex flex-col justify-between shadow-xl shadow-blue-200 relative overflow-hidden">
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white opacity-10 rounded-full" />
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Dépenses (mois)</p>
                    <p className="text-4xl font-bold">{formatEuro(kpis.totalAmount || 0)}</p>
                  </div>
                  <div className="bg-blue-500 bg-opacity-30 p-2 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-blue-100">
                  <span>Coût /100km</span>
                  <span className="font-semibold text-white">{formatEuro(kpis.costPer100Km || 0)}</span>
                </div>
                <div className="flex justify-between text-blue-100">
                  <span>Conso moyenne</span>
                  <span className="font-semibold text-white">{formatNumber(kpis.litersPer100Km || 0)} L/100km</span>
                </div>
              </div>
            </div>
          </div>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 lg:col-span-2">
              <p className="text-sm font-semibold text-slate-900 mb-2">Évolution mensuelle</p>
              <div className="flex gap-2 overflow-x-auto text-sm text-slate-600">
                {evolution.map((m) => (
                  <div key={m.month} className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 min-w-[110px]">
                    <p className="font-semibold text-slate-800">{m.month}</p>
                    <p className="text-slate-600">{formatEuro(m.total || 0)}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-sm font-semibold text-slate-900 mb-4">Répartition annuelle</p>
              <div className="space-y-3 text-sm text-slate-700">
                {distribution.map((d) => (
                  <div key={d.type} className="flex items-center justify-between">
                    <span className="capitalize">{d.type}</span>
                    <span className="font-semibold">{formatEuro(d.total || 0)}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {maintenance && (
            <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <p className="text-sm font-semibold text-slate-900 mb-2">Maintenance prioritaire</p>
              <div className="flex items-center justify-between text-sm text-slate-700">
                <div>
                  <p className="font-semibold text-slate-900">{maintenance.title}</p>
                  {maintenance.nextAtDate && (
                    <p className="text-slate-600">
                      Échéance: {new Date(maintenance.nextAtDate).toLocaleDateString('fr-FR')}
                    </p>
                  )}
                </div>
                <span className="px-2 py-1 rounded bg-amber-100 text-amber-700 font-semibold">{maintenance.status}</span>
              </div>
            </section>
          )}

          <section className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Transactions</p>
                <h3 className="text-xl font-bold text-slate-900">Dépenses récentes</h3>
              </div>
            </div>
            {recentExpenses.length === 0 ? (
              <p className="text-sm text-slate-600">Aucune dépense.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-xs font-semibold">
                    <tr>
                      <th className="px-4 py-3 text-left">Type</th>
                      <th className="px-4 py-3 text-left">Date</th>
                      <th className="px-4 py-3 text-left">Libellé</th>
                      <th className="px-4 py-3 text-left">Km</th>
                      <th className="px-4 py-3 text-right">Montant</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {recentExpenses.map((exp) => (
                      <tr key={exp._id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 capitalize text-slate-700">{exp.type}</td>
                        <td className="px-4 py-3 text-slate-600">
                          {exp.date ? new Date(exp.date).toLocaleDateString('fr-FR') : '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-800 font-semibold">{exp.label || 'Dépense'}</td>
                        <td className="px-4 py-3 text-slate-600">{exp.km != null ? formatNumber(exp.km) : '—'}</td>
                        <td className="px-4 py-3 text-right text-slate-900 font-semibold">
                          {formatEuro(exp.amount || 0)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </PageTransition>
  );
}

function StatCard({ label, value }) {
  return (
    <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
      <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold">{label}</p>
      <p className="text-xl font-bold text-slate-900 mt-1">{value}</p>
    </div>
  );
}
