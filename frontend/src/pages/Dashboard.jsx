import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../src/api';
import PageTransition from '../components/PageTransition';
import Section from '../components/Section';
import MetricTile from '../components/MetricTile';
import StatChip from '../components/StatChip';
import { Skeleton } from '../components/ui/skeleton';

export default function Dashboard() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await api.get('/api/vehicles', { params: { page: 1, limit: 100 } });
        setVehicles(res.data.data);
      } catch (err) {
        console.error('Erreur chargement véhicules :', err);
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  return (
    <PageTransition>
      <div className="container mx-auto mt-10 px-4 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Mes véhicules</h1>
          <button
            onClick={() => navigate('/add-vehicle')}
            className="rounded-2xl bg-accent px-4 py-2 text-accent-foreground shadow-sm hover:bg-accent/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-accent"
          >
            + Ajouter un véhicule
          </button>
        </div>

        <Section title="">
          {loading ? (
            <Skeleton className="h-24 md:col-span-3 xl:col-span-3" />
          ) : vehicles.length === 0 ? (
            <p className="md:col-span-6 xl:col-span-12 text-muted-foreground">
              Aucun véhicule pour le moment.
            </p>
          ) : (
            vehicles.map((veh) => (
              <MetricTile
                key={veh._id}
                onClick={() => navigate(`/vehicle/${veh._id}`)}
                className="cursor-pointer md:col-span-3 xl:col-span-3"
                value={veh.name}
                label={`${veh.brand} ${veh.model} (${veh.year})`}
              >
                <StatChip value={veh.initialKm} label="Km init." />
                {veh.plate && (
                  <StatChip value={veh.plate} label="Plaque" className="mt-2" />
                )}
              </MetricTile>
            ))
          )}
        </Section>
      </div>
    </PageTransition>
  );
}
