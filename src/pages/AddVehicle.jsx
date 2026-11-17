import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import PageTransition from '../components/PageTransition';
import VehicleForm from '../components/VehicleForm';
import { emptyVehicle, vehicleFormData } from '../lib/forms';

export default function AddVehicle() {
  const [vehicle, setVehicle] = useState({ ...emptyVehicle });
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();
  const submit = async event => {
    event.preventDefault();
    if (saving) return;
    setMessage('');
    setSaving(true);
    try {
      const result = await api.post('/api/vehicles', vehicleFormData(vehicle, file));
      navigate(result.data?._id ? `/vehicle/${result.data._id}` : '/');
    } catch (err) {
      setMessage(err.response?.data?.error || err.message || 'Impossible d’ajouter le véhicule.');
    } finally { setSaving(false); }
  };
  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-slate-100">
        <button onClick={() => navigate('/')} className="text-sm text-slate-400 hover:text-slate-200">← Retour au garage</button>
        <div><h1 className="text-3xl font-bold tracking-tight">Ajouter un véhicule</h1><p className="text-slate-400 mt-2">Un nouvel espace pour suivre ses dépenses, ses pleins et ses entretiens.</p></div>
        <div className="app-surface rounded-2xl p-6 sm:p-8"><VehicleForm vehicle={vehicle} setVehicle={setVehicle} file={file} setFile={setFile} onSubmit={submit} saving={saving} message={message} submitLabel="Ajouter le véhicule" onCancel={() => navigate('/')} /></div>
      </div>
    </PageTransition>
  );
}
