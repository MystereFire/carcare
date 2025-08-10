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

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 flex justify-between items-center">
      <div>
        <p className="text-sm text-gray-600">{task.title}</p>
        <p className="text-gray-900">
          Prochaine échéance dans {distanceRemaining != null ? <strong>{distanceRemaining}</strong> : null}{distanceRemaining != null ? ' km' : ''}
          {daysRemaining != null && distanceRemaining != null ? ' ou ' : ''}
          {daysRemaining != null ? (<><strong>{daysRemaining}</strong> jours</>) : ''}
        </p>
      </div>
      <button onClick={() => navigate(`/vehicle/${vehicleId}/maintenance`)} className="text-blue-600 hover:underline">
        Voir le carnet
      </button>
    </div>
  );
}
