import React, { useState, useEffect } from 'react';
import api from '../../src/api';
import { useNavigate, useParams } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

export default function EditVehicle() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState({
    name: '',
    brand: '',
    model: '',
    year: '',
    plate: '',
    vin: '',
    tankSize: '',
    initialKm: '',
    acquisitionDate: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [file, setFile] = useState(null);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await api.get(`/api/vehicles/${id}`);
        setVehicle({
          name: res.data.name || '',
          brand: res.data.brand || '',
          model: res.data.model || '',
          year: res.data.year || '',
          plate: res.data.plate || '',
          vin: res.data.vin || '',
          tankSize: res.data.tankSize || '',
          initialKm: res.data.initialKm || '',
          acquisitionDate: res.data.acquisitionDate ? res.data.acquisitionDate.slice(0,10) : ''
        });
      } catch (err) {
        console.error('Erreur chargement véhicule', err);
      }
    };
    fetchVehicle();
  }, [id]);


  const handleChange = (e) => {
    setVehicle({ ...vehicle, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    try {
      const formData = new FormData();

      Object.entries(vehicle).forEach(([key, val]) => {
        formData.append(key, val);
      });

      if (file) {
        formData.append('image', file);
      }

      await api.put(`/api/vehicles/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('✅ Véhicule mis à jour');
      setTimeout(() => navigate(`/vehicle/${id}`), 1000);
    } catch (err) {
      setMessage('❌ Erreur lors de la mise à jour');
    }
  };


  return (
    <PageTransition>
      <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Modifier le véhicule</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" value={vehicle.name} placeholder="Nom du véhicule" onChange={handleChange} className="w-full p-2 border rounded" required />
          <input name="brand" value={vehicle.brand} placeholder="Marque" onChange={handleChange} className="w-full p-2 border rounded" required />
          <input name="model" value={vehicle.model} placeholder="Modèle" onChange={handleChange} className="w-full p-2 border rounded" required />
          <input name="year" value={vehicle.year} type="number" placeholder="Année" onChange={handleChange} className="w-full p-2 border rounded" required />
          <input name="acquisitionDate" value={vehicle.acquisitionDate} type="date" onChange={handleChange} className="w-full p-2 border rounded" />
          <input name="plate" value={vehicle.plate} placeholder="Plaque (optionnel)" onChange={handleChange} className="w-full p-2 border rounded" />
          <input name="vin" value={vehicle.vin} placeholder="VIN (optionnel)" onChange={handleChange} className="w-full p-2 border rounded" />
          <input name="tankSize" value={vehicle.tankSize} type="number" placeholder="Capacité réservoir (L)" onChange={handleChange} className="w-full p-2 border rounded" />
          <input name="initialKm" value={vehicle.initialKm} type="number" placeholder="Kilométrage initial" onChange={handleChange} className="w-full p-2 border rounded" required />
          <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Enregistrer</button>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="w-full" />
        </form>
        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </PageTransition>
  );
}
