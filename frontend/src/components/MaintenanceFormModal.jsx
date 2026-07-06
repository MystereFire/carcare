import React, { useEffect, useState } from 'react';
import { useToast } from './ToastProvider';
import api from '../api';
import clsx from 'clsx';

export default function MaintenanceFormModal({ isOpen, onClose, vehicleId, initialData }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    title: '',
    notes: '',
    intervalKm: '',
    intervalDays: '',
    lastDoneKm: '',
    lastDoneDate: '',
    inspectionDate: '',
    isInspection: false,
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        notes: initialData.notes || '',
        intervalKm: initialData.intervalKm || '',
        intervalDays: initialData.intervalDays || '',
        lastDoneKm: initialData.lastDoneKm || '',
        lastDoneDate: initialData.lastDoneDate ? initialData.lastDoneDate.substring(0, 10) : '',
        inspectionDate: initialData.inspectionDate ? initialData.inspectionDate.substring(0, 10) : '',
        isInspection: !!initialData.isInspection,
      });
    } else {
      setForm({
        title: '',
        notes: '',
        intervalKm: '',
        intervalDays: '',
        lastDoneKm: '',
        lastDoneDate: '',
        inspectionDate: '',
        isInspection: false,
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.isInspection && !form.intervalKm && !form.intervalDays) {
      addToast('Indiquez un intervalle en km ou en jours.', 'error');
      return;
    }
    try {
      const payload = { ...form };
      if (form.isInspection && !form.title) payload.title = 'Contrôle technique';
      if (initialData) {
        await api.patch(`/api/maintenance/${initialData._id}`, payload);
        addToast('Tâche mise à jour');
      } else {
        await api.post(`/api/maintenance/${vehicleId}`, payload);
        addToast('Tâche créée');
      }
      onClose(true);
    } catch (err) {
      addToast('Erreur serveur', 'error');
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm";
  const labelClass = "block text-xs font-bold uppercase text-slate-500 tracking-widest mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={() => onClose(false)}
      />

      <div className="relative w-full max-w-lg bg-slate-900/90 border border-white/5 rounded-3xl shadow-2xl transform transition-all overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-6 py-5 border-b border-white/5 bg-slate-950/20 flex justify-between items-center sticky top-0 z-10">
          <h2 className="text-xl font-black text-slate-100 tracking-tight">
            {initialData ? 'Modifier la tâche' : 'Nouvelle tâche'}
          </h2>
          <button
            onClick={() => onClose(false)}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-xl hover:bg-white/5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="p-6 overflow-y-auto custom-scrollbar text-slate-100">
          <form id="maintenanceForm" onSubmit={handleSubmit} className="space-y-6">

            <div className="bg-white/5 p-4 rounded-xl border border-white/5">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center">
                  <input
                    type="checkbox"
                    name="isInspection"
                    checked={form.isInspection}
                    onChange={handleChange}
                    className="peer sr-only"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                </div>
                <span className="text-sm font-semibold text-slate-350 group-hover:text-indigo-400 transition-colors">
                  Il s'agit du contrôle technique
                </span>
              </label>
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Titre</label>
              <input
                name="title"
                value={form.title}
                onChange={handleChange}
                required
                className={inputClass}
                placeholder={form.isInspection ? 'Contrôle technique' : 'Ex: Vidange, Pneus...'}
              />
            </div>

            <div className="space-y-1">
              <label className={labelClass}>Notes</label>
              <textarea
                name="notes"
                value={form.notes}
                onChange={handleChange}
                rows="3"
                className={inputClass}
                placeholder="Détails supplémentaires..."
              />
            </div>

            {!form.isInspection && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center gap-3">
                  <div className="h-px bg-white/5 flex-1"></div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Fréquence</span>
                  <div className="h-px bg-white/5 flex-1"></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className={labelClass}>Tous les (Km)</label>
                    <div className="relative">
                      <input type="number" name="intervalKm" value={form.intervalKm} onChange={handleChange} className={clsx(inputClass, "pr-8")} />
                      <span className="absolute right-3 top-3 text-xs font-bold text-slate-550">KM</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className={labelClass}>Tous les (Jours)</label>
                    <div className="relative">
                      <input type="number" name="intervalDays" value={form.intervalDays} onChange={handleChange} className={clsx(inputClass, "pr-10")} />
                      <span className="absolute right-3 top-3 text-xs font-bold text-slate-550">Jours</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="h-px bg-white/5 flex-1"></div>
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Dernière réalisation</span>
                <div className="h-px bg-white/5 flex-1"></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className={labelClass}>Kilométrage</label>
                  <div className="relative">
                    <input type="number" name="lastDoneKm" value={form.lastDoneKm} onChange={handleChange} className={clsx(inputClass, "pr-8")} />
                    <span className="absolute right-3 top-3 text-xs font-bold text-slate-550">KM</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className={labelClass}>Date</label>
                  <input type="date" name="lastDoneDate" value={form.lastDoneDate} onChange={handleChange} className={inputClass} />
                </div>
              </div>
            </div>

            <div className="space-y-1 pt-2">
              <label className={labelClass}>Prochain Contrôle Technique</label>
              <input type="date" name="inspectionDate" value={form.inspectionDate} onChange={handleChange} className={inputClass} />
            </div>
          </form>
        </div>

        <div className="px-6 py-4 bg-slate-950/20 border-t border-white/5 sticky bottom-0 flex justify-end gap-3 z-10">
          <button
            type="button"
            onClick={() => onClose(false)}
            className="px-5 py-2.5 rounded-xl font-bold text-slate-400 hover:text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 transition-all"
          >
            Annuler
          </button>
          <button
            type="submit"
            form="maintenanceForm"
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5 transition-all"
          >
            Enregistrer
          </button>
        </div>
      </div>
    </div>
  );
}
