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

  const inputClass = "w-full border border-slate-200 p-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-slate-700 font-medium bg-slate-50/50 hover:bg-white";
  const labelClass = "block text-xs font-bold uppercase text-slate-500 tracking-wider mb-1.5";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
        onClick={() => onClose(false)}
      />

      <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl transform transition-all overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <h2 className="text-xl font-bold text-slate-800">
            Marquer comme fait
          </h2>
          <button
            onClick={() => onClose(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 rounded-full hover:bg-slate-100"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-green-50 rounded-xl p-4 border border-green-100 mb-2">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-white rounded-lg text-green-600 shadow-sm shrink-0">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">{task?.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">Confirmez le kilométrage et la date de réalisation.</p>
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <label className={labelClass}>Kilométrage</label>
            <div className="relative">
              <input type="number" value={doneKm} onChange={(e) => setDoneKm(e.target.value)} className={clsx(inputClass, "pr-8")} />
              <span className="absolute right-3 top-3 text-xs font-bold text-slate-400">KM</span>
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
              className="flex-1 px-4 py-3 rounded-xl font-bold text-slate-500 hover:text-slate-700 hover:bg-slate-50 border border-transparent transition-all"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-green-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              Valider
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
