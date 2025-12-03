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
      <div className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm flex items-start justify-center overflow-y-auto py-10 px-4">
        <div className="relative w-full max-w-4xl bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-300/40">
          <button
            onClick={handleCancel}
            className="absolute top-3 right-3 text-slate-400 hover:text-slate-600 rounded-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Fermer"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          <div className="p-6 md:p-8 space-y-6">
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <button
                onClick={handleCancel}
                className="inline-flex items-center gap-2 text-blue-600 hover:underline"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
                Retour
              </button>
              <span>•</span>
              <span>Ajouter une dépense</span>
            </div>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                  Dépenses
                </p>
                <h1 className="text-2xl font-bold text-slate-900">Ajouter une dépense</h1>
                <p className="text-sm text-slate-500">
                  Renseigne le type, le montant et les infos de trajet pour suivre tes coûts.
                </p>
              </div>
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-xl px-4 py-3 shadow-md shadow-blue-200">
                <p className="text-xs text-blue-100 uppercase tracking-wide font-semibold">
                  Raccourci
                </p>
                <p className="text-sm font-medium">Ajoute tes pleins et entretiens plus vite.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Type de dépense</label>
                <select
                  name="type"
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={expense.type}
                >
                  <option value="fuel">Carburant</option>
                  <option value="maintenance">Entretien</option>
                  <option value="repair">Réparation</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Libellé</label>
                <input
                  type="text"
                  name="label"
                  placeholder="Ex: Plein Total Access"
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Montant (€)</label>
                <input
                  type="number"
                  inputMode="decimal"
                  step="0.01"
                  name="amount"
                  placeholder="0.00"
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Date</label>
                <input
                  type="date"
                  name="date"
                  value={expense.date}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Kilométrage</label>
                <input
                  type="number"
                  name="km"
                  placeholder="Ex: 127500"
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {expense.type === 'fuel' && (
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700">Litres</label>
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    name="liters"
                    placeholder="Ex: 45"
                    onChange={handleChange}
                    className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <label className="flex items-center gap-2 text-sm text-slate-700">
                    <input
                      type="checkbox"
                      name="isFullFill"
                      checked={expense.isFullFill || false}
                      onChange={handleChange}
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    />
                    Plein effectué
                  </label>
                </div>
              )}

              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-semibold text-slate-700">Notes (facultatif)</label>
                <textarea
                  name="notes"
                  placeholder="Infos supplémentaires sur la dépense"
                  onChange={handleChange}
                  className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
              </div>

              <div className="md:col-span-2 flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="w-full sm:w-auto inline-flex justify-center rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-md shadow-blue-200 hover:bg-blue-700 transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
                  </svg>
                  {saving ? 'Enregistrement...' : 'Ajouter la dépense'}
                </button>
              </div>
            </form>

            {message && (
              <div className="mt-4 rounded-lg bg-slate-50 border border-slate-200 px-4 py-3 text-sm text-slate-700">
                {message}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
