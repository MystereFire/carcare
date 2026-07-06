import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import api from '../../src/api';
import PageTransition from '../components/PageTransition';
import EditExpenseModal from '../components/EditExpenseModal';
import { formatDate, formatEuro } from '../lib/formatters';

export default function VehicleExpenses() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [vehicle, setVehicle] = useState(null);
    const [filter, setFilter] = useState('all');
    const [editExpense, setEditExpense] = useState(null);
    const [loading, setLoading] = useState(true);

    const typeBadges = {
        fuel: { label: 'Carburant', bg: 'bg-blue-100', text: 'text-blue-600' },
        maintenance: { label: 'Entretien', bg: 'bg-amber-100', text: 'text-amber-700' },
        repair: { label: 'Réparation', bg: 'bg-red-100', text: 'text-red-600' },
    };

    const handleDelete = async (expenseId) => {
        if (!window.confirm('Supprimer cette dépense ?')) return;
        try {
            await api.delete(`/api/expenses/${expenseId}`);
            setExpenses((prev) => prev.filter((e) => e._id !== expenseId));
        } catch (err) {
            console.error('Erreur suppression :', err);
            alert("Erreur lors de la suppression");
        }
    };

    const handleExport = async () => {
        try {
            const res = await api.get(`/api/expenses/vehicle/${id}/export`, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([res.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `expenses-${vehicle ? vehicle.name || vehicle.brand : id}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (err) {
            console.error("Export error:", err);
            alert("Erreur lors de l'exportation des données.");
        }
    };

    const loadData = async () => {
        try {
            setLoading(true);
            const [vehRes, expRes] = await Promise.all([
                api.get(`/api/vehicles/${id}`),
                api.get(`/api/expenses/${id}`, { params: { page: 1, limit: 1000 } }),
            ]);
            setVehicle(vehRes.data);
            const list = Array.isArray(expRes.data?.data) ? expRes.data.data : [];
            setExpenses([...list].reverse()); // Recent first
        } catch (err) {
            console.error('Erreur chargement données', err);
        } finally {
            setLoading(false);
        }
    };

    const handleImport = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const text = evt.target.result;
                await api.post(`/api/expenses/vehicle/${id}/import`, { csvText: text });
                alert("Données importées avec succès !");
                await loadData();
            } catch (err) {
                console.error("Import error:", err);
                alert(err.response?.data?.error || "Erreur lors de l'importation.");
            }
        };
        reader.readAsText(file);
    };

    useEffect(() => {
        loadData();
    }, [id]);

    const filtered = useMemo(() => {
        if (filter === 'all') return expenses;
        return expenses.filter(e => e.type === filter);
    }, [expenses, filter]);

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
        <PageTransition>
            <div className="min-h-screen bg-[#070a13] text-slate-100 p-8">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <button
                                onClick={() => navigate('/')}
                                className="text-slate-400 hover:text-slate-200 font-medium flex items-center gap-2 mb-2 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
                                Retour
                            </button>
                            <h1 className="text-3xl font-black text-slate-100 tracking-tight">
                                Historique des dépenses
                            </h1>
                            {vehicle && (
                                <p className="text-slate-400 font-medium mt-1">
                                    {vehicle.brand} {vehicle.model} • <span className="bg-slate-900/60 text-slate-300 border border-white/10 px-2 py-0.5 rounded text-xs">{vehicle.plate}</span>
                                </p>
                            )}
                        </div>
                        <button
                            onClick={() => navigate(`/vehicle/${id}/add-expense`)}
                            className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all font-semibold flex items-center gap-2"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" /></svg>
                            Ajouter une dépense
                        </button>
                    </div>

                    {/* Content */}
                    <div className="glass-card rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
                        <div className="p-6 border-b border-white/5 bg-slate-900/20 backdrop-blur-sm flex flex-col sm:flex-row gap-4 justify-between items-center">
                            <div className="flex gap-2 p-1 bg-white/5 border border-white/5 rounded-xl">
                                {['all', 'fuel', 'maintenance', 'repair'].map((f) => (
                                    <button
                                        key={f}
                                        onClick={() => setFilter(f)}
                                        className={clsx(
                                            'px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                                            filter === f
                                                ? 'bg-white/10 text-white border border-white/10'
                                                : 'text-slate-400 hover:text-slate-200'
                                        )}
                                    >
                                        {f === 'all' ? 'Tout' : typeBadges[f]?.label || f}
                                    </button>
                                ))}
                            </div>
                            <div className="flex flex-wrap items-center gap-3">
                                <button
                                    onClick={handleExport}
                                    className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 bg-slate-950/20 rounded-xl transition-all flex items-center gap-1.5"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                    Exporter CSV
                                </button>
                                <label
                                    className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-white/5 border border-white/10 bg-slate-950/20 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                                    Importer CSV
                                    <input type="file" accept=".csv" onChange={handleImport} className="hidden" />
                                </label>
                                <div className="text-sm font-bold text-slate-400">
                                    {filtered.length} dépense{filtered.length > 1 ? 's' : ''}
                                </div>
                            </div>
                        </div>

                        {loading ? (
                            <div className="p-12 text-center text-slate-400 animate-pulse">Chargement de l'historique...</div>
                        ) : filtered.length === 0 ? (
                            <div className="p-24 text-center flex flex-col items-center">
                                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-4 text-slate-500">
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
                                </div>
                                <p className="text-slate-400 font-medium">Aucune dépense trouvée pour ce filtre.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-900/40 text-slate-400 uppercase tracking-wider text-xs font-bold border-b border-white/5">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Type</th>
                                            <th className="px-6 py-4">Description</th>
                                            <th className="px-6 py-4">Kilométrage</th>
                                            <th className="px-6 py-4 text-right">Montant</th>
                                            <th className="px-6 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {filtered.map((exp) => (
                                            <tr key={exp._id} className="hover:bg-white/5 transition-colors group">
                                                <td className="px-6 py-4 text-slate-400 font-medium whitespace-nowrap">
                                                    {formatDate(exp.date)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    {renderTypeBadge(exp.type)}
                                                </td>
                                                <td className="px-6 py-4 font-semibold text-slate-200">
                                                    {exp.label || '—'}
                                                    {exp.notes && <p className="text-xs text-slate-500 font-normal mt-0.5 truncate max-w-xs">{exp.notes}</p>}
                                                </td>
                                                <td className="px-6 py-4 text-slate-300 font-mono text-xs bg-white/5 border border-white/5 rounded-lg">
                                                    {exp.km ? `${formatNumber(exp.km)} km` : '—'}
                                                </td>
                                                <td className="px-6 py-4 text-right font-bold text-slate-100">
                                                    {formatEuro(exp.amount)}
                                                </td>
                                                <td className="px-6 py-4 text-right space-x-2">
                                                    <button
                                                        onClick={() => setEditExpense(exp)}
                                                        className="text-slate-400 hover:text-indigo-400 transition-colors"
                                                        title="Modifier"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(exp._id)}
                                                        className="text-slate-400 hover:text-red-400 transition-colors"
                                                        title="Supprimer"
                                                    >
                                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {editExpense && (
                <EditExpenseModal
                    expense={editExpense}
                    onClose={() => setEditExpense(null)}
                    onSave={async (updated) => {
                        try {
                            const res = await api.put(`/api/expenses/${updated._id}`, updated);
                            setExpenses((prev) => prev.map((e) => (e._id === updated._id ? res.data : e)));
                            setEditExpense(null);
                        } catch (err) {
                            alert("Erreur lors de la mise à jour");
                        }
                    }}
                />
            )}
        </PageTransition>
    );
}
