import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../src/api';
import { API_URL } from '../../src/config';
import PageTransition from '../components/PageTransition';

export default function VehicleDetails() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadVehicle = async () => {
      try {
        const res = await api.get(`/api/vehicles/${id}`);
        setVehicle(res.data);
      } catch (err) {
        console.error('Failed to fetch vehicle', err);
      } finally {
        setLoading(false);
      }
    };
    loadVehicle();
  }, [id]);

  if (loading) {
    return (
      <PageTransition>
        <p className="text-center mt-20">Chargement...</p>
      </PageTransition>
    );
  }

  if (!vehicle) {
    return (
      <PageTransition>
        <p className="text-center mt-20">Véhicule introuvable</p>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto mt-6 px-4 space-y-4">
        <h1 className="text-3xl font-bold">
          {vehicle.name} {vehicle.model}{' '}
          <span className="text-foreground/60">({vehicle.year})</span>
        </h1>
        {vehicle.image && (
          <img
            src={`${API_URL}${vehicle.image}`}
            alt={`Photo du véhicule ${vehicle.name} ${vehicle.model}`}
            className="w-full h-64 object-cover rounded-lg"
          />
        )}
        <ul className="space-y-2">
          <li>Km initial : {vehicle.initialKm}</li>
          <li>Km actuel : {vehicle.currentOdometer ?? 'N/A'}</li>
          <li>Réservoir : {vehicle.tankSize ?? 'N/A'} L</li>
        </ul>
      </div>
    </PageTransition>
  );
}
