import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import PageTransition from '../components/PageTransition';
import VehicleForm from '../components/VehicleForm';
import { emptyVehicle, vehicleFormData } from '../lib/forms';

export default function EditVehicle() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [vehicle, setVehicle] = useState({ ...emptyVehicle });
  const [image, setImage] = useState(null);
  const [file, setFile] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [saving, setSaving] = useState(false);
  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setLoadError('');
    api.get(`/api/vehicles/${id}`, { signal: controller.signal }).then(({ data }) => {
      const fields = Object.fromEntries(Object.keys(emptyVehicle).map(key => [key, data[key] ?? '']));
      fields.acquisitionDate = fields.acquisitionDate.slice(0, 10);
      setVehicle(fields);
      setImage(data.image);
    }).catch(err => {
      if (!controller.signal.aborted) setLoadError(err.response?.data?.error || 'Impossible de charger le véhicule.');
    }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [id]);
  const submit = async event => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setMessage('');
    try {
      await api.put(`/api/vehicles/${id}`, vehicleFormData(vehicle, file));
      navigate(`/vehicle/${id}`);
    } catch (err) {
      setMessage(err.response?.data?.error || err.message || 'Impossible de modifier le véhicule.');
    } finally { setSaving(false); }
  };
  return (
    <PageTransition>
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6 text-slate-100">
        <button onClick={() => navigate(`/vehicle/${id}`)} className="text-sm text-slate-400 hover:text-slate-200">← Retour au véhicule</button>
        <div><h1 className="text-3xl font-bold tracking-tight">Modifier le véhicule</h1><p className="text-slate-400 mt-2">Gardez les informations de votre véhicule à jour.</p></div>
        {loading ? <p role="status" className="text-slate-400">Chargement du véhicule…</p> : loadError ? <p role="alert" className="text-red-400">{loadError}</p> : <div className="app-surface rounded-2xl p-6 sm:p-8"><VehicleForm vehicle={vehicle} setVehicle={setVehicle} file={file} setFile={setFile} image={image} onSubmit={submit} saving={saving} message={message} submitLabel="Enregistrer les modifications" onCancel={() => navigate(`/vehicle/${id}`)} /></div>}
      </div>
    </PageTransition>
  );
}
