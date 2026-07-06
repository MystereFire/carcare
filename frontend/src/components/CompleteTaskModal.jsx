import React, { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from './ToastProvider';
import clsx from 'clsx';

export default function CompleteTaskModal({ isOpen, onClose, task, vehicle, onOptimistic }) {
  const { addToast } = useToast();
  const [doneKm, setDoneKm] = useState('');
  const [doneDate, setDoneDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDoneKm(vehicle?.currentOdometer || '');
      setDoneDate(new Date().toISOString().substring(0, 10));
    }
  }, [isOpen, vehicle]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (onOptimistic) onOptimistic();
      await api.post(`/api/maintenance/${task._id}/complete`, { doneKm, doneDate });
      addToast('Tâche complétée !');
      onClose(true);
    } catch (err) {
      addToast('Erreur serveur', 'error');
    }
  };

  const inputClass = "w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-slate-100 placeholder-slate-650 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-all text-sm";
  const labelClass = "block text-xs font-bold uppercase text-slate-500 tracking-widest mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        onClick={() => onClose(false)}
      />

      <div className="relative w-full max-w-sm bg-slate-900/90 border border-white/5 rounded-3xl shadow-2xl transform transition-all overflow-hidden text-slate-100">
        <div className="px-6 py-5 border-b border-white/5 bg-slate-950/20 flex justify-between items-center">
          <h2 className="text-xl font-black text-slate-100 tracking-tight">
            Marquer comme fait
          </h2>
          <button
            onClick={() => onClose(false)}
            className="text-slate-400 hover:text-slate-200 transition-colors p-1.5 rounded-xl hover:bg-white/5"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-emerald-950/20 rounded-xl p-4 border border-emerald-500/20 mb-2">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white/5 rounded-lg text-emerald-400 border border-white/5 shadow-sm shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h3 className="font-black text-slate-100 text-sm">{task?.title}</h3>
                <p className="text-xs text-slate-400 mt-1 leading-relaxed">Confirmez le kilométrage et la date de réalisation.</p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelClass}>Kilométrage</label>
            <div className="relative">
              <input type="number" value={doneKm} onChange={(e) => setDoneKm(e.target.value)} className={clsx(inputClass, "pr-8")} />
              <span className="absolute right-3 top-3 text-xs font-bold text-slate-500">KM</span>
            </div>
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Date de réalisation</label>
            <input type="date" value={doneDate} onChange={(e) => setDoneDate(e.target.value)} className={inputClass} />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => onClose(false)}
              className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-400 hover:text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:shadow-xl hover:-translate-y-0.5 transition-all text-sm"
            >
              Valider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
