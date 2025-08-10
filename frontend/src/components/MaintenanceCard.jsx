import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

export default function MaintenanceCard({ vehicleId }) {
  const [tasks, setTasks] = useState([]);
  const [vehicle, setVehicle] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [tasksRes, vehicleRes] = await Promise.all([
          api.get(`/api/maintenance/${vehicleId}`),
          api.get(`/api/vehicles/${vehicleId}`)
        ]);
        setTasks(tasksRes.data);
        setVehicle(vehicleRes.data);
      } catch (err) {
        // ignore
      }
    };
    fetchData();
  }, [vehicleId]);

  if (!tasks.length) return null;

  const priority = { DUE: 0, SOON: 1, OK: 2 };
  const sorted = [...tasks].sort((a, b) => {
    const p = priority[a.status] - priority[b.status];
    if (p !== 0) return p;
    return new Date(a.nextAtDate || '2100-01-01') - new Date(b.nextAtDate || '2100-01-01');
  });
  const task = sorted[0];

  const currentOdo = vehicle?.currentOdometer || 0;
  const distanceRemaining = task.nextAtKm != null ? task.nextAtKm - currentOdo : null;
  const daysRemaining = task.nextAtDate ? Math.ceil((new Date(task.nextAtDate) - new Date()) / 86400000) : null;

  const styles = {
    OK: 'bg-blue-200 text-blue-800',
    SOON: 'bg-yellow-200 text-yellow-800',
    DUE: 'bg-red-200 text-red-800'
  };
  const badgeClass = styles[task.status] || styles.OK;

  return (
    <div className="bg-blue-50 rounded-2xl shadow-sm border border-gray-100 p-4 flex flex-col h-full">
      <div className="flex justify-between items-start">
        <h3 className="text-lg font-semibold flex items-center gap-2" title="Prochaine tâche d'entretien">🛠️ Entretien</h3>
        <span className={`px-2 py-1 rounded text-xs font-bold ${badgeClass}`}>{task.status}</span>
      </div>
      <p className="mt-2 text-gray-800">{task.title}</p>
      <div className="mt-1 text-sm text-gray-600">
        {distanceRemaining != null && <p>{distanceRemaining} km</p>}
        {daysRemaining != null && <p>{daysRemaining} jours</p>}
      </div>
      <div className="mt-auto text-right">
        <button
          onClick={() => navigate(`/vehicle/${vehicleId}/maintenance`)}
          aria-label="Voir le carnet d'entretien"
          className="text-blue-600 hover:underline text-sm"
        >
          Voir le carnet
        </button>
      </div>
    </div>
  );
}
