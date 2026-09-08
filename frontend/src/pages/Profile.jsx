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
      <div className="min-h-screen bg-[#080b10] text-slate-100 py-10">
        <div className="max-w-6xl mx-auto px-4 space-y-8">
          <div className="glass-card rounded-lg p-6 border border-white/5 shadow-2xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 font-bold flex items-center justify-center text-xl shadow-md shadow-indigo-500/5">
                {user?.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Mon compte</p>
                <h1 className="text-2xl font-black text-slate-100">{user?.name || 'Utilisateur'}</h1>
                <p className="text-sm text-slate-400">{user?.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate('/add-vehicle')}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-4 py-2.5 shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all text-sm font-bold"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v12m6-6H6" />
                </svg>
                Ajouter un véhicule
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="glass-card rounded-lg p-6 border border-white/5 lg:col-span-2 space-y-6">
              <h2 className="text-xl font-black text-slate-100">Sécurité</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="sporty-label">Mot de passe actuel</label>
                    <input
                      type="password"
                      name="currentPassword"
                      placeholder="••••••••"
                      value={form.currentPassword}
                      onChange={handleChange}
                      className="sporty-input"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="sporty-label">Nouveau mot de passe</label>
                    <input
                      type="password"
                      name="newPassword"
                      placeholder="••••••••"
                      value={form.newPassword}
                      onChange={handleChange}
                      className="sporty-input"
                      required
                    />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="sporty-label">Confirmez le nouveau mot de passe</label>
                    <input
                      type="password"
                      name="confirmNewPassword"
                      placeholder="••••••••"
                      value={form.confirmNewPassword}
                      onChange={handleChange}
                      className="sporty-input"
                      required
                    />
                  </div>
                </div>
                <button className="mt-4 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-2.5 px-5 rounded-xl shadow-lg shadow-indigo-500/20 hover:-translate-y-0.5 transition-all text-sm">
                  Mettre à jour le mot de passe
                </button>
                {message && <p className="text-sm text-indigo-400 mt-2 font-semibold">{message}</p>}
              </form>
            </div>

            <div className="glass-card rounded-lg p-6 border border-white/5 flex flex-col justify-between">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Résumé</p>
                <h3 className="text-xl font-black text-slate-100 mb-6">Mes données</h3>
                <div className="space-y-4 text-sm text-slate-400">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span>Nombre de véhicules</span>
                    <span className="font-bold text-slate-100 text-base speed-font">{vehiclesCount}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-lg p-6 border border-white/5 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Garage</p>
                <h3 className="text-xl font-black text-slate-100">Mes véhicules</h3>
              </div>
              <button
                onClick={() => navigate('/add-vehicle')}
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-indigo-400 px-4 py-2 transition text-sm font-bold"
              >
                + Ajouter
              </button>
            </div>

            {loadingVehicles ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-40 rounded-xl bg-slate-900/40 border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : vehicles.length === 0 ? (
              <div className="text-sm text-slate-400">Aucun véhicule pour le moment.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {vehicles.map((veh) => {
                  const imgSrc = veh.image ? `${API_URL}${veh.image}` : '/car-placeholder.svg';
                  return (
                    <div
                      key={veh._id}
                      className="glass-card rounded-lg border border-white/5 overflow-hidden flex flex-col group"
                    >
                      <div className="relative h-32 overflow-hidden">
                        <img
                          src={imgSrc}
                          alt={veh.name || 'Véhicule'}
                          className="absolute inset-0 w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = '/car-placeholder.svg';
                          }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 to-transparent" />
                        <div className="absolute bottom-2 left-3 right-3 text-white">
                          <p className="text-xs text-slate-300 font-semibold">{veh.brand} {veh.model}</p>
                          <p className="text-lg font-bold leading-tight truncate">{veh.name}</p>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 text-sm text-slate-400 flex-1">
                        <div className="flex items-center justify-between">
                          <span>Plaque</span>
                          <span className="font-bold text-slate-200">{veh.plate || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Année</span>
                          <span className="font-bold text-slate-200">{veh.year || '—'}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span>Kilométrage initial</span>
                          <span className="font-bold text-slate-200 speed-font">
                            {veh.initialKm ? formatNumber(veh.initialKm) : '—'} km
                          </span>
                        </div>
                      </div>
                      <div className="p-4 flex justify-between items-center border-t border-white/5 text-sm bg-slate-900/10">
                        <button
                          onClick={() => navigate(`/vehicle/${veh._id}`)}
                          className="text-indigo-400 hover:text-indigo-300 font-bold transition"
                        >
                          Détails
                        </button>
                        <button
                          onClick={() => handleDeleteVehicle(veh)}
                          className="text-red-400 hover:text-red-300 font-bold transition"
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
