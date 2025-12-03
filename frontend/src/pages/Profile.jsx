import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';
import PageTransition from '../components/PageTransition';
import { API_URL } from '../config';
import { formatNumber } from '../lib/formatters';
import clsx from 'clsx';

export default function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(true);
  const [form, setForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmNewPassword: '',
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await api.get('/api/auth/me');
        setUser(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    const fetchVehicles = async () => {
      setLoadingVehicles(true);
      try {
        const res = await api.get('/api/vehicles', { params: { page: 1, limit: 100 } });
        setVehicles(Array.isArray(res.data?.data) ? res.data.data : []);
      } catch (err) {
        console.error('Erreur chargement véhicules', err);
      } finally {
        setLoadingVehicles(false);
      }
    };
    fetchUser();
    fetchVehicles();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (form.newPassword !== form.confirmNewPassword) {
      setMessage('Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await api.put('/api/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMessage('Mot de passe modifié');
      setForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setMessage('Erreur lors du changement de mot de passe');
    }
  };

  const vehiclesCount = useMemo(() => vehicles.length, [vehicles]);

  const handleDeleteVehicle = async (veh) => {
    if (!window.confirm('Supprimer ce véhicule et ses données ?')) return;
    try {
      await api.delete(`/api/vehicles/${veh._id}`);
      setVehicles((list) => list.filter((v) => v._id !== veh._id));
    } catch (err) {
      console.error('Erreur suppression véhicule', err);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-[calc(100vh-64px)] bg-slate-50 text-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-xl">
                {user?.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Mon compte</p>
                <h1 className="text-2xl font-bold text-slate-900">{user?.name || 'Utilisateur'}</h1>
                <p className="text-sm text-slate-600">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/add-vehicle')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 shadow-md shadow-blue-200 hover:bg-blue-700 transition text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
                </svg>
                Ajouter un véhicule
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 lg:col-span-2">
              <h2 className="text-lg font-bold text-slate-900 mb-4">Sécurité</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Mot de passe actuel</label>
                    <input
                      type="password"
                      name="currentPassword"
                      placeholder="Mot de passe actuel"
                      value={form.currentPassword}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-sm font-semibold text-slate-700">Nouveau mot de passe</label>
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="Nouveau mot de passe"
                      value={form.newPassword}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="text-sm font-semibold text-slate-700">Confirmez le nouveau mot de passe</label>
                    <input
                      type="password"
                      name="confirmNewPassword"
                      placeholder="Confirmez"
                      value={form.confirmNewPassword}
                      onChange={handleChange}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    />
                  </div>
                </div>
                <button className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 shadow-md shadow-blue-200 hover:bg-blue-700 transition text-sm">
                  Mettre à jour le mot de passe
                </button>
                {message && <p className="text-sm text-blue-700 mt-2">{message}</p>}
              </form>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
              <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Résumé</p>
              <h3 className="text-xl font-bold text-slate-900 mb-4">Mes données</h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center justify-between">
                  <span>Véhicules</span>
                  <span className="font-semibold text-slate-900">{vehiclesCount}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Garage</p>
                <h3 className="text-xl font-bold text-slate-900">Mes véhicules</h3>
              </div>
              <button
                onClick={() => navigate('/add-vehicle')}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 text-white px-4 py-2 shadow-md shadow-blue-200 hover:bg-blue-700 transition text-sm"
              >
                + Ajouter
              </button>
            </div>

            {loadingVehicles ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 rounded-xl bg-slate-100 animate-pulse" />
                ))}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-sm text-slate-600">Aucun véhicule pour le moment.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {vehicles.map((veh) => {
                  const imgSrc = veh.image ? `${API_URL}${veh.image}` : '/car-placeholder.svg';
                  return (
                    <div
                      key={veh._id}
                      className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col"
                    >
                      <div className="relative h-32">
                        <img
                          src={imgSrc}
                          alt={veh.name || 'Véhicule'}
                          className="absolute inset-0 w-full h-full object-cover"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/car-placeholder.svg';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3 text-white">
                          <p className="text-sm text-slate-200">{veh.brand} {veh.model}</p>
                          <p className="text-lg font-semibold leading-tight">{veh.name}</p>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 text-sm text-slate-600 flex-1">
                        <div className="flex items-center justify-between">
                          <span>Plaque</span>
                          <span className="font-semibold text-slate-900">{veh.plate || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Année</span>
                          <span className="font-semibold text-slate-900">{veh.year || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Km initial</span>
                          <span className="font-semibold text-slate-900">
                            {veh.initialKm ? formatNumber(veh.initialKm) : '—'}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex justify-between items-center border-t border-slate-100 text-sm">
                        <button
                          onClick={() => navigate(`/vehicle/${veh._id}`)}
                          className="text-blue-600 hover:underline"
                        >
                          Voir
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(veh)}
                          className="text-red-600 hover:underline"
                        >
                          Supprimer
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
