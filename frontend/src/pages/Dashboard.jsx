import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../src/api';
import PageTransition from '../components/PageTransition';
import { API_URL } from '../../src/config';

export default function Dashboard() {
  const navigate = useNavigate();
  const [vehicles, setVehicles] = useState([]);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        const res = await api.get('/api/vehicles', { params: { page: 1, limit: 100 } });
        setVehicles(res.data.data);
      } catch (err) {
        console.error('Erreur chargement véhicules :', err);
      }
    };

    fetchVehicles();
  }, []);

  return (
    <PageTransition>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Mes véhicules</h1>
          <button
            onClick={() => navigate('/add-vehicle')}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
          >
            + Ajouter un véhicule
          </button>
        </div>

        {vehicles.length === 0 ? (
          <p className="text-gray-600">Aucun véhicule pour le moment.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {vehicles.map((veh) => (
              <div
                key={veh._id}
                onClick={() => navigate(`/vehicle/${veh._id}`)}
                className="cursor-pointer bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow transition"
              >
                <h2 className="text-xl font-semibold mb-1">{veh.name}</h2>

                {veh.image && (
                  <img
                    src={`${API_URL}${veh.image}`}
                    alt={veh.name}
                    className="w-full h-40 object-cover rounded mb-2"
                  />
                )}

                <p className="text-gray-700">
                  {veh.brand} {veh.model} ({veh.year})
                </p>
                <p className="text-sm text-gray-500">Km initial : {veh.initialKm}</p>
                {veh.plate && (
                  <p className="text-sm text-gray-500">Plaque : {veh.plate}</p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
