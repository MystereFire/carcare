import React, { useEffect, useState } from 'react';
import api from '../api';
import { useToast } from './ToastProvider';

export default function CompleteTaskModal({ isOpen, onClose, task, vehicle, onOptimistic }) {
  const { addToast } = useToast();
  const [doneKm, setDoneKm] = useState('');
  const [doneDate, setDoneDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setDoneKm(vehicle?.currentOdometer || '');
      setDoneDate(new Date().toISOString().substring(0,10));
    }
  }, [isOpen, vehicle]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (onOptimistic) onOptimistic();
      await api.post(`/api/maintenance/${task._id}/complete`, { doneKm, doneDate });
      addToast('Tâche complétée');
      onClose(true);
    } catch (err) {
      addToast('Erreur serveur', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg space-y-4 w-full max-w-md">
        <h2 className="text-lg font-semibold">Marquer comme fait</h2>
        <div className="space-y-1">
          <label className="block text-sm">Km</label>
          <input type="number" value={doneKm} onChange={(e) => setDoneKm(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm">Date</label>
          <input type="date" value={doneDate} onChange={(e) => setDoneDate(e.target.value)} className="w-full border p-2 rounded" />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => onClose(false)} className="px-4 py-2 rounded border">Annuler</button>
          <button type="submit" className="px-4 py-2 bg-indigo-500 text-white rounded">Valider</button>
        </div>
      </form>
    </div>
  );
}
