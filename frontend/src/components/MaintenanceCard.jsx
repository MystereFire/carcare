import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import Section from './Section';

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
    OK: 'bg-success/20 text-success',
    SOON: 'bg-warning/20 text-warning',
    DUE: 'bg-danger/20 text-danger'
  };
  const badgeClass = styles[task.status] || styles.OK;

  return (
    <Section
      title="Entretien"
      actions={<span className={`px-2 py-1 rounded text-xs font-bold ${badgeClass}`}>{task.status}</span>}
      className="h-full flex flex-col"
    >
      <p className="mt-2 text-foreground">{task.title}</p>
      <div className="mt-1 text-sm text-foreground/60">
        {distanceRemaining != null && <p>{distanceRemaining} km restants</p>}
        {daysRemaining != null && <p>{daysRemaining} jours restants</p>}
      </div>
      <div className="mt-auto text-right">
        <button
          onClick={() => navigate(`/vehicle/${vehicleId}/maintenance`)}
          aria-label="Voir le carnet d'entretien"
          className="text-accent hover:underline text-sm"
        >
          Voir le carnet
        </button>
      </div>
    </Section>
  );
}
