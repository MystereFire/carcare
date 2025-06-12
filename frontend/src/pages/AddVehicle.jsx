import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';
import { API_URL } from '../../src/config';

export default function AddVehicle() {
  const [vehicle, setVehicle] = useState({
    name: '',
    brand: '',
    model: '',
    year: '',
    plate: '',
    vin: '',
    initialKm: ''
  });
  const [message, setMessage] = useState('');
  const navigate = useNavigate();
  const [file, setFile] = useState(null);


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

      await axios.post(`${API_URL}/api/vehicles`, formData, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('✅ Véhicule ajouté avec succès');
      setTimeout(() => navigate('/'), 1000);
    } catch (err) {
      setMessage('❌ Erreur lors de l’ajout');
    }
  };


  return (
    <PageTransition>
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Ajouter un véhicule</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input name="name" placeholder="Nom du véhicule" onChange={handleChange} className="w-full p-2 border rounded" required />
          <input name="brand" placeholder="Marque" onChange={handleChange} className="w-full p-2 border rounded" required />
          <input name="model" placeholder="Modèle" onChange={handleChange} className="w-full p-2 border rounded" required />
          <input name="year" type="number" placeholder="Année" onChange={handleChange} className="w-full p-2 border rounded" required />
          <input name="plate" placeholder="Plaque (optionnel)" onChange={handleChange} className="w-full p-2 border rounded" />
          <input name="vin" placeholder="VIN (optionnel)" onChange={handleChange} className="w-full p-2 border rounded" />
          <input name="initialKm" type="number" placeholder="Kilométrage initial" onChange={handleChange} className="w-full p-2 border rounded" required />
          <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Ajouter</button>
          <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} className="w-full" />
        </form>
        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </PageTransition>
  );
}
