import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../api';
import MaintenanceFormModal from '../components/MaintenanceFormModal';
import CompleteTaskModal from '../components/CompleteTaskModal';
import { useToast } from '../components/ToastProvider';

export default function MaintenancePage() {
  const { id } = useParams();
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

  const filtered = tasks.filter((t) => {
    const matchFilter = filter === 'ALL' || t.status === filter;
    const matchSearch = t.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  }).sort((a, b) => {
    const p = priority[a.status] - priority[b.status];
    if (p !== 0) return p;
    return new Date(a.nextAtDate || '2100-01-01') - new Date(b.nextAtDate || '2100-01-01');
  });

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

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-semibold">Carnet d'entretien</h1>
        <button onClick={() => { setEditing(null); setFormOpen(true); }} className="bg-indigo-500 text-white px-4 py-2 rounded">
          Nouvelle tâche
        </button>
      </div>
      <div className="flex gap-2 mb-4">
        <select value={filter} onChange={(e) => setFilter(e.target.value)} className="border p-2 rounded">
          <option value="ALL">Tous</option>
          <option value="OK">OK</option>
          <option value="SOON">SOON</option>
          <option value="DUE">DUE</option>
        </select>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Recherche" className="flex-1 border p-2 rounded" />
      </div>
      {loading ? (
        <div className="space-y-2">
          {[1,2,3].map(i => <div key={i} className="h-20 bg-gray-200 animate-pulse rounded" />)}
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-gray-600">Aucune tâche.</p>
      ) : (
        <div className="space-y-4">
          {filtered.map((t) => (
            <div key={t._id} className="bg-white p-4 rounded shadow-sm flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">{t.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded ${t.status === 'OK' ? 'bg-green-100 text-green-700' : t.status === 'SOON' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{t.status}</span>
                </div>
                {t.notes && <p className="text-sm text-gray-600 truncate max-w-xs">{t.notes}</p>}
                <p className="text-sm text-gray-600">
                  {t.intervalKm ? `Tous les ${t.intervalKm} km` : ''} {t.intervalDays ? `/${t.intervalDays} jours` : ''}
                </p>
                <p className="text-sm">
                  Prochaine échéance dans {distanceRemaining(t) != null ? `${distanceRemaining(t)} km` : ''}
                  {daysRemaining(t) != null && distanceRemaining(t) != null ? ' ou ' : ''}
                  {daysRemaining(t) != null ? `${daysRemaining(t)} jours` : ''}
                </p>
              </div>
              <div className="flex flex-col gap-1 text-sm">
                <button onClick={() => { setEditing(t); setFormOpen(true); }} className="text-blue-600">Éditer</button>
                <button onClick={() => handleDelete(t)} className="text-red-600">Supprimer</button>
                <button onClick={() => setCompleteTask(t)} className="text-green-600">Marquer comme fait</button>
              </div>
            </div>
          ))}
        </div>
      )}

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
    </div>
  );
}
