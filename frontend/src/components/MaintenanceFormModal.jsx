import React, { useEffect, useState } from 'react';
import { useToast } from './ToastProvider';
import api from '../api';

export default function MaintenanceFormModal({ isOpen, onClose, vehicleId, initialData }) {
  const { addToast } = useToast();
  const [form, setForm] = useState({
    title: '',
    notes: '',
    intervalKm: '',
    intervalDays: '',
    lastDoneKm: '',
    lastDoneDate: ''
  });

  useEffect(() => {
    if (initialData) {
      setForm({
        title: initialData.title || '',
        notes: initialData.notes || '',
        intervalKm: initialData.intervalKm || '',
        intervalDays: initialData.intervalDays || '',
        lastDoneKm: initialData.lastDoneKm || '',
        lastDoneDate: initialData.lastDoneDate ? initialData.lastDoneDate.substring(0,10) : ''
      });
    } else {
      setForm({
        title: '',
        notes: '',
        intervalKm: '',
        intervalDays: '',
        lastDoneKm: '',
        lastDoneDate: ''
      });
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.intervalKm && !form.intervalDays) {
      addToast('Interval km ou jours requis', 'error');
      return;
    }
    try {
      if (initialData) {
        await api.patch(`/api/maintenance/${initialData._id}`, form);
        addToast('Tâche mise à jour');
      } else {
        await api.post(`/api/maintenance/${vehicleId}`, form);
        addToast('Tâche créée');
      }
      onClose(true);
    } catch (err) {
      addToast('Erreur serveur', 'error');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center" role="dialog" aria-modal="true">
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg space-y-4 w-full max-w-md">
        <h2 className="text-lg font-semibold">{initialData ? 'Modifier' : 'Nouvelle'} tâche</h2>
        <div className="space-y-1">
          <label className="block text-sm">Titre*</label>
          <input name="title" value={form.title} onChange={handleChange} required className="w-full border p-2 rounded" />
        </div>
        <div className="space-y-1">
          <label className="block text-sm">Notes</label>
          <textarea name="notes" value={form.notes} onChange={handleChange} className="w-full border p-2 rounded" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="block text-sm">Interval Km</label>
            <input type="number" name="intervalKm" value={form.intervalKm} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div className="space-y-1">
            <label className="block text-sm">Interval Jours</label>
            <input type="number" name="intervalDays" value={form.intervalDays} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <label className="block text-sm">Dernier Km</label>
            <input type="number" name="lastDoneKm" value={form.lastDoneKm} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
          <div className="space-y-1">
            <label className="block text-sm">Dernière date</label>
            <input type="date" name="lastDoneDate" value={form.lastDoneDate} onChange={handleChange} className="w-full border p-2 rounded" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={() => onClose(false)} className="px-4 py-2 rounded border">Annuler</button>
          <button type="submit" className="px-4 py-2 bg-indigo-500 text-white rounded">Enregistrer</button>
        </div>
      </form>
    </div>
  );
}
