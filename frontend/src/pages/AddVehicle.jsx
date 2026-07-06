import React, { useState } from 'react';
import api from '../../src/api';
import { useNavigate } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

export default function AddVehicle() {
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
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const handleChange = (e) => {
    setVehicle({ ...vehicle, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setSubmitting(true);

    try {
      const formData = new FormData();

      Object.entries(vehicle).forEach(([key, val]) => {
        if (val !== undefined && val !== '') {
          formData.append(key, val);
        }
      });

      if (file) {
        formData.append('image', file);
      }

      await api.post('/api/vehicles', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setMessage('success');
      setTimeout(() => navigate('/'), 1200);
    } catch (err) {
      console.error(err);
      setMessage(err.response?.data?.error || 'Erreur lors de l’ajout du véhicule.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#070a13] text-slate-100 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/5 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />

        <div className="w-full max-w-2xl bg-slate-900/60 backdrop-blur-2xl border border-white/5 rounded-3xl shadow-2xl p-8 flex flex-col relative z-10">
          {/* Back button */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="text-slate-400 hover:text-slate-200 font-semibold flex items-center gap-1.5 mb-6 transition-colors self-start text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour
          </button>

          {/* Title */}
          <h2 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-350 mb-6 tracking-tight">
            Ajouter un véhicule
          </h2>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* General information group */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1.5">
                  Informations Générales
                </h3>
                
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Nom d'usage (ex: Voiture principale)</label>
                  <input
                    name="name"
                    placeholder="Nom personnalisé du véhicule"
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Marque</label>
                  <input
                    name="brand"
                    placeholder="ex: Peugeot, Renault, Tesla..."
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Modèle</label>
                  <input
                    name="model"
                    placeholder="ex: 208, Clio, Model 3..."
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Année</label>
                    <input
                      name="year"
                      type="number"
                      placeholder="ex: 2020"
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-400 mb-1.5">Date d'achat</label>
                    <input
                      name="acquisitionDate"
                      type="date"
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm"
                    />
                  </div>
                </div>
              </div>

              {/* Technical specifications group */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-white/5 pb-1.5">
                  Détails Techniques
                </h3>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Kilométrage initial</label>
                  <input
                    name="initialKm"
                    type="number"
                    placeholder="ex: 15000"
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Capacité du réservoir (Litres)</label>
                  <input
                    name="tankSize"
                    type="number"
                    step="any"
                    placeholder="ex: 50"
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Plaque d'immatriculation</label>
                  <input
                    name="plate"
                    placeholder="ex: AA-123-BB"
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1.5">Code VIN (Numéro de châssis)</label>
                  <input
                    name="vin"
                    placeholder="17 caractères"
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-950/50 text-slate-100 placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-sm"
                  />
                </div>
              </div>

              {/* Photo Upload area */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest">
                  Photo du Véhicule
                </label>
                <div className="relative group border border-dashed border-white/10 hover:border-indigo-500/40 hover:bg-white/5 rounded-2xl p-6 transition-all cursor-pointer flex flex-col items-center justify-center min-h-[140px]">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  {previewUrl ? (
                    <div className="flex flex-col items-center gap-3">
                      <img
                        src={previewUrl}
                        alt="Prévisualisation"
                        className="h-28 object-contain rounded-xl shadow-lg border border-white/5 bg-slate-950/40"
                      />
                      <span className="text-xs text-slate-350 font-semibold bg-white/5 px-3 py-1 rounded-full border border-white/10">
                        {file.name}
                      </span>
                    </div>
                  ) : (
                    <div className="text-center space-y-2">
                      <svg
                        className="w-10 h-10 text-slate-500 mx-auto group-hover:text-indigo-400 transition-colors"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm font-semibold text-slate-300">
                        Glissez-déposez une image ou cliquez pour parcourir
                      </p>
                      <p className="text-xs text-slate-500">PNG, JPG, GIF ou WEBP (5 Mo max)</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Notifications */}
            {message && (
              <div
                className={clsx(
                  'rounded-xl px-4 py-3 text-sm font-semibold border flex items-center gap-2 shadow-lg',
                  message === 'success'
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20'
                    : 'bg-red-950/20 text-red-400 border-red-500/20'
                )}
              >
                {message === 'success' ? (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Véhicule ajouté avec succès ! Redirection en cours...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{message}</span>
                  </>
                )}
              </div>
            )}

            {/* Submit button */}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all duration-200"
            >
              {submitting ? (
                <>
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Création en cours...</span>
                </>
              ) : (
                <span>Ajouter le véhicule</span>
              )}
            </button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
}
