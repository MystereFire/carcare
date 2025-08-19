import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import api from '../../src/api';
import PageTransition from '../components/PageTransition';
import { API_URL } from '../../src/config';

export default function Dashboard() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedId, setSelectedId] = useState(
    () => localStorage.getItem('currentVehicleId') || ''
  );

  useEffect(() => {
    document.title = 'CarCare — Mes véhicules';
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await api.get('/api/vehicles', { params: { page: 1, limit: 100 } });
        setVehicles(res.data.data);
      } catch (err) {
        console.error('Erreur chargement véhicules :', err);
        setError('Erreur lors du chargement des véhicules');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  const handleSelect = (id) => {
    localStorage.setItem('currentVehicleId', id);
    setSelectedId(id);
    navigate(`/vehicle/${id}`);
  };

  return (
    <PageTransition>
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Mes véhicules</h1>
            <p className="text-gray-600">Gérez tous vos véhicules</p>
          </div>
          <button
            onClick={() => navigate('/add-vehicle')}
            className="mt-4 sm:mt-0 inline-flex items-center justify-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
          >
            + Ajouter un véhicule
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded bg-red-100 px-4 py-2 text-red-700" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-64 rounded-lg bg-white shadow-sm animate-pulse"
              />
            ))}
          </div>
        ) : vehicles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <img
              src="/car-placeholder.svg"
              alt="Aucun véhicule"
              className="h-40 w-40 opacity-50"
            />
            <p className="mt-4 text-gray-600">Aucun véhicule</p>
            <button
              onClick={() => navigate('/add-vehicle')}
              className="mt-6 inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            >
              Ajouter un véhicule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
            {vehicles.map((veh) => {
              const imgSrc = veh.image ? `${API_URL}${veh.image}` : '/car-placeholder.svg';
              const isSelected = selectedId === veh._id;
              return (
                <button
                  key={veh._id}
                  onClick={() => handleSelect(veh._id)}
                  className={clsx(
                    'overflow-hidden rounded-lg bg-white text-left shadow-sm transition hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                    isSelected && 'ring-2 ring-blue-500'
                  )}
                >
                  <img
                    src={imgSrc}
                    alt={`Image de ${veh.brand} ${veh.model}`}
                    loading="lazy"
                    className="h-48 w-full object-cover"
                  />
                  <div className="p-4">
                    <h2 className="mb-1 text-lg font-semibold">Voiture {veh.name}</h2>
                    <p className="text-sm text-gray-700">
                      {veh.brand} {veh.model} ({veh.year})
                    </p>
                    <p className="text-sm text-gray-500">Km initial : {veh.initialKm}</p>
                    {veh.plate && (
                      <p className="text-sm text-gray-500">Plaque : {veh.plate}</p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}

