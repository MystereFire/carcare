import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../src/api';
import PageTransition from '../components/PageTransition';

export default function AddExpense({ vehicleId: vehicleIdProp, onClose }) {
  const { id } = useParams(); // vehicleId
  const navigate = useNavigate();
  const vehicleId = vehicleIdProp || id;
  const [expense, setExpense] = useState({
    type: 'fuel',
    label: '',
    amount: '',
    date: new Date().toISOString().slice(0, 10),
    km: '',
    liters: '',
    isFullFill: false,
    notes: '',
  });
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox') {
      setExpense({ ...expense, [name]: checked });
    } else {
      const updated = { ...expense, [name]: value };
      if (name === 'type' && value !== 'fuel') {
        updated.liters = '';
        updated.isFullFill = false;
      }
      setExpense(updated);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      await api.post('/api/expenses', {
        ...expense,
        vehicleId,
        amount: Number(expense.amount),
        km: expense.km ? Number(expense.km) : undefined,
        liters: expense.liters ? Number(expense.liters) : undefined,
      });
      setMessage('Dépense enregistrée');
      if (onClose) {
        setTimeout(() => onClose(), 600);
      } else {
        setTimeout(() => navigate(`/vehicle/${vehicleId}`), 800);
      }
    } catch (err) {
      console.error('Erreur ajout dépense', err);
      setMessage("Erreur lors de l'ajout de la dépense");
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (onClose) {
      onClose();
    } else {
      navigate(`/vehicle/${vehicleId}`);
    }
  };

  return (
    <PageTransition>
      <div className="fixed inset-0 z-40 bg-slate-950/80 backdrop-blur-md flex items-center justify-center overflow-y-auto p-4">
        <div className="relative w-full max-w-2xl app-surface rounded-lg shadow-2xl overflow-hidden">
          <button
            onClick={handleCancel}
            className="absolute top-4 right-4 text-slate-400 hover:text-slate-200 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </button>
              <span>•</span>
              <span className="text-slate-400">Ajouter une dépense</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl font-black text-slate-100 tracking-tight">Ajouter une dépense</h1>
                <p className="text-sm text-slate-400 mt-1">
                  Renseigne le type, le montant et les infos de trajet pour suivre tes coûts.
                </p>
              </div>
              <div className="bg-gradient-to-r from-indigo-500/10 to-purple-600/10 border border-indigo-500/20 text-indigo-400 rounded-xl px-4 py-3 shadow-md">
                <p className="text-xxs uppercase tracking-wider font-bold">
                  Raccourci
                </p>
                <p className="text-xs font-medium text-slate-300 mt-0.5">Ajoute tes pleins et entretiens plus vite.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="sporty-label">Type de dépense</label>
                <select
                  name="type"
                  onChange={handleChange}
                  className="sporty-input bg-slate-950 pr-8"
                  value={expense.type}
                >
                  <option value="fuel" className="bg-slate-900 text-slate-100">Carburant</option>
                  <option value="maintenance" className="bg-slate-900 text-slate-100">Entretien</option>
                  <option value="repair" className="bg-slate-900 text-slate-100">Réparation</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="sporty-label">Libellé</label>
                <input
                  type="text"
                  name="label"
                  placeholder="Ex: Plein Total Access"
                  onChange={handleChange}
                  className="sporty-input"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="sporty-label">Montant (€)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  name="amount"
                  placeholder="0.00"
                  onChange={handleChange}
                  className="sporty-input"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="sporty-label">Date</label>
                <input
                  type="date"
                  name="date"
                  value={expense.date}
                  onChange={handleChange}
                  className="sporty-input"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="sporty-label">Kilométrage</label>
                <input
                  type="number"
                  name="km"
                  placeholder="Ex: 127500"
                  onChange={handleChange}
                  className="sporty-input"
                  required
                />
              </div>

              {expense.type === 'fuel' && (
                <div className="space-y-3">
                  <div className="space-y-1">
                    <label className="sporty-label">Litres</label>
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      name="liters"
                      placeholder="Ex: 45"
                      onChange={handleChange}
                      className="sporty-input"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      name="isFullFill"
                      checked={expense.isFullFill || false}
                      onChange={handleChange}
                      className="rounded border-white/10 bg-slate-900/60 text-indigo-600 focus:ring-indigo-500/50"
                    />
                    Plein effectué
                  </label>
                </div>
              )}

              <div className="md:col-span-2 space-y-1">
                <label className="sporty-label">Notes (facultatif)</label>
                <textarea
                  name="notes"
                  placeholder="Infos supplémentaires sur la dépense..."
                  onChange={handleChange}
                  className="sporty-input py-3 h-24"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto inline-flex justify-center rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-semibold text-slate-300 hover:bg-white/10 transition-all duration-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold px-6 py-2.5 text-sm shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
                  </svg>
                  {saving ? 'Enregistrement...' : 'Ajouter la dépense'}
                </button>
              </div>
            </form>

            {message && (
              <div className="mt-4 rounded-xl bg-slate-900/50 border border-white/5 px-4 py-3 text-sm text-slate-300 font-semibold">
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
