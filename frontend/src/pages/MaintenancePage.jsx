import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import api from '../api';
import MaintenanceFormModal from '../components/MaintenanceFormModal';
import CompleteTaskModal from '../components/CompleteTaskModal';
import { useToast } from '../components/ToastProvider';
import PageTransition from '../components/PageTransition';

export default function MaintenancePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [vehicle, setVehicle] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [completeTask, setCompleteTask] = useState(null);

  const fetchData = async () => {
    try {
      const [tasksRes, vehicleRes] = await Promise.all([
        api.get(`/api/maintenance/${id}`),
        api.get(`/api/vehicles/${id}`)
      ]);
      setTasks(tasksRes.data);
      setVehicle(vehicleRes.data);
    } catch (err) {
      addToast('Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const priority = { DUE: 0, SOON: 1, OK: 2 };

  const inspectionTasks = tasks.filter((t) => t.isInspection);
  const filtered = useMemo(() => {
    return tasks
      .filter((t) => !t.isInspection)
      .filter((t) => {
        const matchFilter = filter === 'ALL' || t.status === filter;
        const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
      })
      .sort((a, b) => {
        const p = priority[a.status] - priority[b.status];
        if (p !== 0) return p;
        return new Date(a.nextAtDate || '2100-01-01') - new Date(b.nextAtDate || '2100-01-01');
      });
  }, [tasks, filter, search]);

  const handleDelete = async (task) => {
    if (!window.confirm('Supprimer cette tâche ?')) return;
    try {
      await api.delete(`/api/maintenance/${task._id}`);
      setTasks((ts) => ts.filter((t) => t._id !== task._id));
      addToast('Tâche supprimée');
    } catch (err) {
      addToast('Erreur suppression', 'error');
    }
  };

  const daysRemaining = (t) => t.nextAtDate ? Math.ceil((new Date(t.nextAtDate) - new Date()) / 86400000) : null;
  const distanceRemaining = (t) => t.nextAtKm != null && vehicle ? t.nextAtKm - (vehicle.currentOdometer || 0) : null;

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'OK':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> OK
        </span>;
      case 'SOON':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Bientôt
        </span>;
      case 'DUE':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 uppercase tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> Urgent
        </span>;
      default:
        return null;
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 text-slate-800 p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <button
                onClick={() => navigate('/')}
                className="text-slate-500 hover:text-slate-800 font-medium flex items-center gap-2 mb-2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                Retour
              </button>
              <h1 className="text-3xl font-bold text-slate-900">Carnet d'entretien</h1>
              {vehicle && (
                <p className="text-slate-500 font-medium">{vehicle.brand} {vehicle.model}</p>
              )}
            </div>
            <button
              onClick={() => { setEditing(null); setFormOpen(true); }}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/30 transition-all transform hover:-translate-y-0.5 font-semibold flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
              Nouvelle tâche
            </button>
          </div>

          {/* Filters & Search */}
          <div className="bg-white/60 backdrop-blur-md p-4 rounded-2xl border border-white/40 shadow-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
            <div className="flex gap-2 p-1 bg-slate-100/80 rounded-xl overflow-x-auto max-w-full">
              {[
                { label: 'Tous', value: 'ALL' },
                { label: 'OK', value: 'OK' },
                { label: 'Bientôt', value: 'SOON' },
                { label: 'Urgent', value: 'DUE' },
              ].map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFilter(opt.value)}
                  className={clsx(
                    'px-4 py-2 rounded-lg text-sm font-bold transition-all whitespace-nowrap',
                    filter === opt.value
                      ? 'bg-white text-slate-800 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500 hover:text-slate-700'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-auto">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
              />
              <svg className="w-5 h-5 text-slate-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>

          {/* Technical Inspection Card */}
          {inspectionTasks.length ? (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100/50 rounded-2xl p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm text-blue-600">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-slate-900">{inspectionTasks[0].title || 'Contrôle technique'}</h3>
                    <p className="text-slate-600 text-sm mt-1">
                      Date : <span className="font-semibold text-slate-800">{inspectionTasks[0].inspectionDate ? new Date(inspectionTasks[0].inspectionDate).toLocaleDateString('fr-FR') : 'Non renseignée'}</span>
                      {inspectionTasks[0].notes && <span className="mx-2 text-slate-300">|</span>}
                      {inspectionTasks[0].notes}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => { setEditing(inspectionTasks[0]); setFormOpen(true); }}
                  className="px-4 py-2 text-sm font-semibold text-blue-600 bg-white border border-blue-100 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
                >
                  Modifier
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 border-dashed rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-slate-200 rounded-xl text-slate-400">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-700">Contrôle technique</h3>
                  <p className="text-slate-500 text-sm">Aucune date renseignée. Pensez à l'ajouter pour le rappel.</p>
                </div>
              </div>
              <button
                onClick={() => { setEditing({ isInspection: true, title: 'Contrôle technique' }); setFormOpen(true); }}
                className="px-5 py-2.5 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 transition-colors shadow-lg"
              >
                Ajouter la date
              </button>
            </div>
          )}

          {/* Tasks List */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => <div key={i} className="h-40 bg-white/50 animate-pulse rounded-2xl border border-white/40" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-white/40 rounded-3xl border border-white/50 backdrop-blur-sm">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <p className="text-lg font-bold text-slate-700">Tout est à jour !</p>
              <p className="text-slate-500">Aucune tâche d'entretien à afficher.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((t) => (
                <div
                  key={t._id}
                  className="bg-white rounded-2xl p-6 shadow-lg shadow-slate-200/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 flex flex-col h-full relative overflow-hidden group"
                >
                  <div className={clsx("absolute top-0 left-0 w-1 h-full", t.status === 'OK' ? 'bg-green-400' : t.status === 'SOON' ? 'bg-amber-400' : 'bg-red-400')} />

                  <div className="flex justify-between items-start mb-4 pl-3">
                    <h3 className="font-bold text-lg text-slate-800 line-clamp-1" title={t.title}>{t.title}</h3>
                    {renderStatusBadge(t.status)}
                  </div>

                  <div className="pl-3 space-y-3 flex-1">
                    {t.notes && <p className="text-sm text-slate-500 line-clamp-2 italic">{t.notes}</p>}

                    <div className="space-y-1 pt-2">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Fréquence</p>
                      <p className="text-sm font-medium text-slate-700 flex items-center gap-2">
                        <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                        {t.intervalKm ? `${t.intervalKm} km` : ''} {t.intervalDays ? `/ ${t.intervalDays} j` : ''}
                        {!t.intervalKm && !t.intervalDays && '—'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Prochaine Échéance</p>
                      <div className="text-sm font-medium text-slate-700">
                        {distanceRemaining(t) !== null && (
                          <div className={clsx("flex items-center gap-2", distanceRemaining(t) < 0 && "text-red-600")}>
                            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                            <span>{distanceRemaining(t) > 0 ? 'Dans ' : 'Dépassé de '}{Math.abs(distanceRemaining(t))} km</span>
                          </div>
                        )}
                        {daysRemaining(t) !== null && (
                          <div className={clsx("flex items-center gap-2 mt-1", daysRemaining(t) < 0 && "text-red-600")}>
                            <svg className="w-4 h-4 opacity-70" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            <span>{daysRemaining(t) > 0 ? 'Dans ' : 'En retard de '}{Math.abs(daysRemaining(t))} jours</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between pl-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button
                      onClick={() => { setEditing(t); setFormOpen(true); }}
                      className="text-slate-400 hover:text-indigo-600 transition-colors text-sm font-semibold flex items-center gap-1"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      Éditer
                    </button>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDelete(t)}
                        className="text-slate-400 hover:text-red-600 transition-colors text-sm font-semibold p-1"
                        title="Supprimer"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                      <button
                        onClick={() => setCompleteTask(t)}
                        className="bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800 px-3 py-1.5 rounded-lg text-sm font-bold transition-all"
                      >
                        Fait
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <MaintenanceFormModal
        isOpen={formOpen}
        onClose={(refresh) => { setFormOpen(false); if (refresh) fetchData(); }}
        vehicleId={id}
        initialData={editing}
      />
      <CompleteTaskModal
        isOpen={!!completeTask}
        onClose={(refresh) => { setCompleteTask(null); if (refresh) fetchData(); }}
        task={completeTask}
        vehicle={vehicle}
        onOptimistic={() => setTasks((ts) => ts.map((t) => t._id === completeTask._id ? { ...t, status: 'OK' } : t))}
      />
    </PageTransition>
  );
}
