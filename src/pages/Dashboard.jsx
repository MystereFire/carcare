import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../api';
import { vehicleImageUrl } from '../config';
import { getAllVehicles, getAllExpenses } from '../lib/data';
import { remainingDays } from '../lib/dates';
import { formatDate, formatEuro, formatNumber } from '../lib/formatters';
import { useToast } from '../components/ToastProvider';
import Icon from '../components/Icon';
import AddExpense from './AddExpense';

const categories = {
  fuel: { label: 'Carburant', icon: 'fuel', color: '#65d6b1' },
  maintenance: { label: 'Entretien', icon: 'tool', color: '#e6bd7e' },
  repair: { label: 'Réparation', icon: 'car', color: '#9aa9f2' },
  other: { label: 'Autres', icon: 'wallet', color: '#8c9cae' },
};

function OdometerDialog({ vehicle, onClose, onSaved }) {
  const ref = useRef(null);
  const [km, setKm] = useState(String(vehicle.currentOdometer ?? vehicle.initialKm ?? 0));
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => { ref.current.showModal(); }, []);
  const save = async (event) => {
    event.preventDefault();
    const value = Number(km);
    if (saving) return;
    if (!km.trim() || !Number.isSafeInteger(value) || value < Number(vehicle.currentOdometer ?? vehicle.initialKm ?? 0)) {
      setError('Saisissez un kilométrage entier au moins égal au compteur actuel.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await api.put(`/api/vehicles/${vehicle._id}`, { currentOdometer: value });
      onSaved();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Le kilométrage n’a pas pu être enregistré.');
      setSaving(false);
    }
  };
  return <dialog ref={ref} onCancel={onClose} className="odometer-dialog" aria-labelledby="odometer-heading"><form onSubmit={save}><div className="panel-heading"><span className="stat-icon mint"><Icon name="gauge" /></span><button type="button" className="icon-button" onClick={onClose} aria-label="Fermer"><Icon name="close" /></button></div><h2 id="odometer-heading">Mettre à jour le compteur</h2><p>Le kilométrage permet de suivre les prochaines échéances d’entretien.</p><label className="sporty-label" htmlFor="new-odometer">Kilométrage actuel (km)</label><input id="new-odometer" className="sporty-input" type="number" min={vehicle.currentOdometer ?? vehicle.initialKm ?? 0} step="1" required autoFocus value={km} onChange={e => setKm(e.target.value)} />{error && <p className="inline-error" role="alert">{error}</p>}<div className="dialog-actions"><button type="button" className="btn-secondary" onClick={onClose}>Annuler</button><button className="btn-primary" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</button></div></form></dialog>;
}

export default function Dashboard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [expenses, setExpenses] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [segments, setSegments] = useState([]);
  const [dataErrors, setDataErrors] = useState({});
  const [dataLoading, setDataLoading] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [period, setPeriod] = useState(6);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [odometerOpen, setOdometerOpen] = useState(false);
  const selectedVehicle = vehicles.find(v => v._id === id);

  useEffect(() => { document.title = 'Tableau de bord · CarCare'; }, []);
  useEffect(() => { setExpenseOpen(false); setOdometerOpen(false); }, [id]);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    getAllVehicles({ signal: controller.signal }).then(list => {
      if (controller.signal.aborted) return;
      setVehicles(list);
      if (!id && list.length) {
        const stored = localStorage.getItem('currentVehicleId');
        const chosen = list.find(v => v._id === stored) || list[0];
        navigate(`/vehicle/${chosen._id}`, { replace: true });
      }
    }).catch(err => {
      if (!controller.signal.aborted) setError(err.response?.data?.error || 'Impossible de charger votre garage. Vérifiez la connexion au serveur.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [refresh, id, navigate]);

  useEffect(() => {
    if (!selectedVehicle) return;
    localStorage.setItem('currentVehicleId', selectedVehicle._id);
    const controller = new AbortController();
    setDataLoading(true);
    setExpenses([]); setTasks([]); setSegments([]); setDataErrors({});
    Promise.allSettled([
      getAllExpenses(selectedVehicle._id, { signal: controller.signal }),
      api.get(`/api/maintenance/${selectedVehicle._id}`, { signal: controller.signal }),
      api.get(`/api/stats/vehicle/${selectedVehicle._id}/consumption`, { signal: controller.signal }),
    ]).then(results => {
      if (controller.signal.aborted) return;
      const nextErrors = {};
      if (results[0].status === 'fulfilled') setExpenses(results[0].value); else nextErrors.expenses = true;
      if (results[1].status === 'fulfilled' && Array.isArray(results[1].value.data)) setTasks(results[1].value.data); else nextErrors.tasks = true;
      if (results[2].status === 'fulfilled' && Array.isArray(results[2].value.data)) setSegments(results[2].value.data); else nextErrors.consumption = true;
      setDataErrors(nextErrors);
      setDataLoading(false);
    });
    return () => controller.abort();
  }, [selectedVehicle?._id, refresh]);

  const stats = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const byType = Object.fromEntries(Object.keys(categories).map(k => [k, 0]));
    let total = 0, monthly = 0;
    for (const e of expenses) {
      const amount = Number(e.amount) || 0;
      total += amount;
      const date = new Date(e.date);
      if (date >= start && date < end) monthly += amount;
      byType[categories[e.type] ? e.type : 'other'] += amount;
    }
    const valid = segments.filter(s => !s.isSuspect && Number(s.km) > 0 && Number(s.liters) > 0);
    const distance = valid.reduce((sum, s) => sum + Number(s.km), 0);
    const consumption = distance ? valid.reduce((sum, s) => sum + Number(s.liters), 0) * 100 / distance : null;
    return { total, monthly, byType, consumption };
  }, [expenses, segments]);
  const monthlySeries = useMemo(() => {
    const now = new Date();
    return Array.from({ length: period }, (_, i) => {
      const date = new Date(now.getFullYear(), now.getMonth() - period + i + 1, 1);
      const end = new Date(date.getFullYear(), date.getMonth() + 1, 1);
      return { label: date.toLocaleDateString('fr-FR', { month: 'short', year: period === 12 ? '2-digit' : undefined }), total: expenses.filter(e => new Date(e.date) >= date && new Date(e.date) < end).reduce((sum, e) => sum + (Number(e.amount) || 0), 0) };
    });
  }, [expenses, period]);
  const recent = useMemo(() => [...expenses].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 4), [expenses]);
  const upcoming = useMemo(() => [...tasks].filter(t => t.status !== 'DONE').sort((a, b) => ({ DUE: 0, SOON: 1, OK: 2 }[a.status] ?? 3) - ({ DUE: 0, SOON: 1, OK: 2 }[b.status] ?? 3) || new Date(a.nextAtDate || '9999-01-01') - new Date(b.nextAtDate || '9999-01-01')).slice(0, 3), [tasks]);
  const inspectionTask = tasks.find(t => t.isInspection);
  const inspectionDays = remainingDays(inspectionTask?.inspectionDate || inspectionTask?.nextAtDate || selectedVehicle?.technicalInspectionDate);
  const inspectionLabel = inspectionDays === null ? 'Date à renseigner' : inspectionDays < 0 ? 'Échéance dépassée' : inspectionDays === 0 ? 'À faire aujourd’hui' : inspectionDays <= 30 ? 'À prévoir bientôt' : 'À jour';
  const km = Number(selectedVehicle?.currentOdometer ?? selectedVehicle?.initialKm ?? 0);
  const unknownExpenses = dataLoading || dataErrors.expenses;
  const money = amount => unknownExpenses ? '—' : formatEuro(amount);
  const reload = () => setRefresh(v => v + 1);

  return <div className="dashboard page-enter">
    <div className="page-heading"><div><span className="eyebrow">CHAQUE KILOMÈTRE COMPTE</span><h1>Tableau de bord<span className="heading-dot">.</span></h1><p>Votre véhicule, vos dépenses. Tout simplement.</p></div><div className="page-actions">{vehicles.length > 0 && <label className="vehicle-switch"><Icon name="car" size={18} /><select aria-label="Véhicule actif" value={id || ''} onChange={e => navigate(`/vehicle/${e.target.value}`)}>{!selectedVehicle && <option value="">Choisir un véhicule</option>}{vehicles.map(v => <option key={v._id} value={v._id}>{v.name || `${v.brand || ''} ${v.model || ''}`.trim() || 'Mon véhicule'}</option>)}</select></label>}<button className="btn-primary" disabled={!selectedVehicle || loading} onClick={() => setExpenseOpen(true)}><Icon name="plus" size={18} />Ajouter une dépense</button></div></div>
    {error ? <div className="error-banner" role="alert"><Icon name="info" /><span>{error}</span><button className="btn-secondary" onClick={reload}>Réessayer</button></div> : loading ? <div className="dashboard-skeleton" role="status" aria-label="Chargement du garage"><div /><div /><div /></div> : !vehicles.length ? <div className="empty-state panel"><span className="empty-icon"><Icon name="car" size={38} /></span><span className="eyebrow">BIENVENUE DANS VOTRE GARAGE</span><h2>Votre prochain trajet commence ici.</h2><p>Ajoutez votre premier véhicule pour suivre vos dépenses, vos pleins et vos entretiens dans un seul espace.</p><Link to="/add-vehicle" className="btn-primary"><Icon name="plus" size={18} />Ajouter un véhicule</Link></div> : !selectedVehicle ? <div className="empty-state panel"><h2>Ce véhicule est introuvable.</h2><p>Sélectionnez un véhicule de votre garage pour continuer.</p><Link to="/" className="btn-secondary">Ouvrir mon garage</Link></div> : <>
      {Object.keys(dataErrors).length > 0 && <div className="error-banner" role="alert"><Icon name="info" /><span>Certaines données n’ont pas pu être chargées. Les indicateurs concernés sont indisponibles.</span><button className="text-link" onClick={reload}>Réessayer</button></div>}
      <div className="overview-grid">
        <section className="vehicle-hero panel" aria-labelledby="vehicle-heading"><div className="vehicle-hero-top"><span className="subtle-badge"><span className="status-dot" />MON VÉHICULE</span><Link to={`/vehicle/${id}/edit`} className="text-link">Gérer le véhicule <Icon name="arrow" size={15} /></Link></div><div className="vehicle-hero-content"><div className="vehicle-identity"><h2 id="vehicle-heading">{selectedVehicle.name || `${selectedVehicle.brand || ''} ${selectedVehicle.model || ''}`.trim() || 'Mon véhicule'}</h2><p>{[selectedVehicle.brand, selectedVehicle.model, selectedVehicle.year].filter(Boolean).join(' · ') || 'Votre compagnon de route'}</p>{selectedVehicle.plate && <span className="license-plate"><span>F</span>{selectedVehicle.plate}</span>}</div><img className="vehicle-art" src={vehicleImageUrl(selectedVehicle.image)} alt={selectedVehicle.name || 'Illustration de votre véhicule'} onError={e => { e.currentTarget.onerror = null; e.currentTarget.src = '/car-placeholder.svg'; }} /></div><div className="vehicle-hero-bottom"><div><span className="metric-label">KILOMÉTRAGE ACTUEL</span><div className="odometer">{formatNumber(km)} <span>km</span></div></div><button className="btn-secondary small" onClick={() => setOdometerOpen(true)}><Icon name="gauge" size={15} />Mettre à jour</button></div></section>
        <section className="monthly-card"><div className="monthly-top"><span>Ce mois-ci</span><span className="monthly-icon"><Icon name="wallet" size={20} /></span></div><div><span className="monthly-month">{new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span><div className="monthly-value">{money(stats.monthly)}</div><p>de dépenses enregistrées</p></div><Link to={`/vehicle/${id}/expenses`}>Consulter mes dépenses <Icon name="arrow" size={19} /></Link><div className="monthly-decoration" aria-hidden="true" /></section>
      </div>
      <div className="stat-grid"><section className="mini-stat panel"><span className="stat-icon mint"><Icon name="wallet" /></span><div><span className="metric-label">DÉPENSES TOTALES</span><strong>{money(stats.total)}</strong><p>Depuis le début du suivi</p></div></section><section className="mini-stat panel"><span className="stat-icon lavender"><Icon name="fuel" /></span><div><span className="metric-label">CONSOMMATION MOYENNE</span><strong>{dataLoading || dataErrors.consumption || stats.consumption === null ? '—' : formatNumber(stats.consumption)} <small>L/100 km</small></strong><p>{stats.consumption === null ? 'Deux pleins complets sont nécessaires' : 'Calculée entre pleins complets'}</p></div></section><section className="mini-stat panel"><span className={`stat-icon ${inspectionDays !== null && inspectionDays <= 30 ? 'amber' : 'mint'}`}><Icon name="shield" /></span><div><span className="metric-label">CONTRÔLE TECHNIQUE</span><strong className="inspection-value">{dataLoading || dataErrors.tasks ? '—' : inspectionLabel}</strong><p>{inspectionDays === null ? 'Ajoutez la date dans le carnet' : formatDate(inspectionTask?.inspectionDate || inspectionTask?.nextAtDate || selectedVehicle.technicalInspectionDate)}</p></div></section></div>
      <div className="analytics-grid"><section className="panel chart-panel"><div className="panel-heading"><div><h2>Vos dépenses au fil des mois</h2><p>Gardez un œil sur votre budget automobile.</p></div><select className="period-select" aria-label="Période du graphique" value={period} onChange={e => setPeriod(Number(e.target.value))}><option value={3}>3 derniers mois</option><option value={6}>6 derniers mois</option><option value={12}>12 derniers mois</option></select></div><div className="chart-total">{money(monthlySeries.reduce((sum, m) => sum + m.total, 0))}<span>sur la période</span></div><div className="spending-chart" role="img" aria-label={`Graphique des dépenses des ${period} derniers mois`}><ResponsiveContainer width="100%" height="100%"><AreaChart data={unknownExpenses ? [] : monthlySeries} margin={{ left: -20, right: 12, top: 15, bottom: 0 }}><defs><linearGradient id="spending-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#65d6b1" stopOpacity={0.25} /><stop offset="100%" stopColor="#65d6b1" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="#ffffff0c" vertical={false} strokeDasharray="4 5" /><XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: '#94a09f', fontSize: 11 }} dy={10} /><YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a09f', fontSize: 11 }} tickFormatter={v => `${v} €`} width={75} /><Tooltip contentStyle={{ background: '#1b2428', border: '1px solid #364347', borderRadius: 12, color: '#eef5f2' }} formatter={v => [formatEuro(v), 'Dépenses']} cursor={{ stroke: '#65d6b1', strokeDasharray: '4 4' }} /><Area type="monotone" dataKey="total" stroke="#65d6b1" strokeWidth={2.5} fill="url(#spending-fill)" activeDot={{ r: 5, fill: '#65d6b1', stroke: '#17221f', strokeWidth: 3 }} isAnimationActive={false} /></AreaChart></ResponsiveContainer></div></section>
        <section className="panel breakdown-panel"><div className="panel-heading"><div><h2>Où va votre budget ?</h2><p>Répartition de toutes vos dépenses</p></div><Icon name="wallet" size={18} /></div><div className="category-stack" aria-hidden="true">{Object.entries(categories).map(([key, c]) => <span key={key} style={{ flex: unknownExpenses ? 1 : stats.byType[key] || (stats.total === 0 ? 1 : 0), background: c.color, opacity: unknownExpenses || stats.total === 0 ? 0.2 : 1 }} />)}</div><div className="category-list">{Object.entries(categories).map(([key, c]) => <div className="category-row" key={key}><span className="category-dot" style={{ background: c.color }} /><span>{c.label}</span><strong>{money(stats.byType[key])}</strong><small>{unknownExpenses ? '—' : stats.total ? Math.round(stats.byType[key] / stats.total * 100) : 0}%</small></div>)}</div></section></div>
      <div className="details-grid"><section className="panel recent-panel"><div className="panel-heading"><div><h2>Dernières dépenses</h2><p>Les petits et grands frais de votre véhicule.</p></div><Link to={`/vehicle/${id}/expenses`} className="text-link">Toutes les dépenses <Icon name="arrow" size={15} /></Link></div>{dataLoading ? <p className="section-empty" role="status">Chargement des dépenses…</p> : dataErrors.expenses ? <p className="section-empty">Historique indisponible.</p> : !recent.length ? <div className="section-empty"><Icon name="wallet" size={26} /><p>Aucune dépense pour le moment.</p><button className="text-link" onClick={() => setExpenseOpen(true)}>Enregistrer votre première dépense</button></div> : <div className="expense-list">{recent.map(e => { const c = categories[e.type] || categories.other; return <Link to={`/vehicle/${id}/expenses`} className="expense-row" key={e._id}><span className="expense-icon" style={{ color: c.color, background: `${c.color}12` }}><Icon name={c.icon} size={19} /></span><div><strong>{e.label || c.label}</strong><span>{formatDate(e.date)} <span className="expense-separator">·</span> {c.label}</span></div><strong className="expense-amount">{formatEuro(e.amount)}</strong><Icon name="arrow" size={15} /></Link>; })}</div>}</section>
        <section className="panel maintenance-panel"><div className="panel-heading"><div><h2>À l’horizon</h2><p>Les prochains rendez-vous de votre auto.</p></div><Icon name="tool" size={18} /></div>{dataLoading ? <p className="section-empty" role="status">Chargement des échéances…</p> : dataErrors.tasks ? <p className="section-empty">Échéances indisponibles.</p> : !upcoming.length ? <div className="section-empty"><Icon name="calendar" size={28} /><p>Aucun entretien planifié.</p></div> : upcoming.map(t => <div className="upcoming-item" key={t._id}><span className={`upcoming-dot ${t.status === 'DUE' ? 'danger' : t.status === 'SOON' ? 'warning' : ''}`} /><div><strong>{t.title}</strong><p>{t.nextAtDate ? formatDate(t.nextAtDate) : t.inspectionDate ? formatDate(t.inspectionDate) : t.nextAtKm != null ? `${formatNumber(t.nextAtKm)} km` : 'Échéance à définir'}</p></div><span className={`task-pill ${t.status === 'DUE' ? 'danger' : t.status === 'SOON' ? 'warning' : ''}`}>{t.status === 'DUE' ? 'À faire' : t.status === 'SOON' ? 'Bientôt' : 'Planifié'}</span></div>)}<Link className="maintenance-link" to={`/vehicle/${id}/maintenance`}>Carnet d’entretien <Icon name="arrow" size={17} /></Link></section></div>
    </>}
    {expenseOpen && selectedVehicle && <AddExpense vehicleId={selectedVehicle._id} onClose={() => { setExpenseOpen(false); reload(); }} />}
    {odometerOpen && selectedVehicle && <OdometerDialog vehicle={selectedVehicle} onClose={() => setOdometerOpen(false)} onSaved={() => { addToast('Kilométrage mis à jour.'); reload(); }} />}
  </div>;
}
