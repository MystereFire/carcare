import React, { useState } from 'react';
import api from '../../src/api';
import { API_URL } from '../../src/config';
import GoogleIcon from '../assets/google.svg';
import { Link } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', terms: false });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [strength, setStrength] = useState(0);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === 'checkbox' ? checked : value;
    setForm((prev) => ({ ...prev, [name]: val }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    if (name === 'password') {
      const len = val.length;
      setStrength(len >= 12 ? 3 : len >= 8 ? 2 : len > 0 ? 1 : 0);
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'Le nom est requis';
    if (!form.email.trim()) newErrors.email = "L'email est requis";
    else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Email invalide';
    if (!form.password) newErrors.password = 'Le mot de passe est requis';
    else if (form.password.length < 8) newErrors.password = 'Au moins 8 caractères';
    if (!form.terms) newErrors.terms = 'Vous devez accepter les CGU';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setMessage('');
    try {
      await api.post('/api/auth/register', {
        name: form.name,
        email: form.email,
        password: form.password,
      });
      setMessage('✅ Inscription réussie !');
      setForm({ name: '', email: '', password: '', terms: false });
      setStrength(0);
    } catch (err) {
      setMessage("❌ Erreur lors de l’inscription");
    } finally {
      setIsLoading(false);
    }
  };

  const isDisabled =
    isLoading ||
    !form.name ||
    !form.email ||
    !form.password ||
    form.password.length < 8 ||
    !form.terms;

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#070a13] flex flex-col justify-center items-center relative overflow-hidden px-4">
        {/* Animated Background Spheres */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-blob" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-blob" style={{ animationDelay: '4s' }} />

        <main className="w-full max-w-md z-10 py-10">
          <div className="glass-card rounded-3xl p-8 space-y-6 border border-white/5 relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 p-4 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/20">
              <svg
                className="w-8 h-8 text-white"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M3 13l1.5-4.5A2 2 0 016.3 7h11.4a2 2 0 011.8 1.5L21 13v5a1 1 0 01-1 1h-1a3 3 0 11-6 0H11a3 3 0 01-6 0H4a1 1 0 01-1-1v-5z" />
              </svg>
            </div>

            <div className="text-center space-y-2 pt-6">
              <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300 tracking-tight">Créer un compte</h1>
              <p className="text-sm text-slate-400">Rejoignez CarCare et suivez vos véhicules</p>
            </div>

            {message && (
              <div
                className="text-center text-sm text-green-200 bg-green-900/30 border border-green-500/30 rounded-xl px-4 py-2.5"
                aria-live="polite"
              >
                {message}
              </div>
            )}

            <button
              type="button"
              onClick={() => (window.location.href = `${API_URL}/api/auth/google`)}
              className="w-full h-12 flex items-center justify-center gap-3 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 rounded-xl transition duration-200"
            >
              <img src={GoogleIcon} alt="" className="w-5 h-5" />
              <span className="font-semibold text-sm">S’inscrire avec Google</span>
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-white/10"></div>
              <span className="px-3 text-xs text-slate-500 font-bold uppercase tracking-widest">OU</span>
              <div className="flex-1 border-t border-white/10"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <label htmlFor="name" className="sporty-label">
                  Nom d'utilisateur
                </label>
                <div className="relative mt-1">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 7.5a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.5 21a8.25 8.25 0 0115 0" />
                  </svg>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    value={form.name}
                    onChange={handleChange}
                    className="sporty-input pl-11"
                    placeholder="Mon Pseudo"
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-400" aria-live="polite">
                    {errors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="sporty-label">
                  Adresse Email
                </label>
                <div className="relative mt-1">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                  </svg>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    className="sporty-input pl-11"
                    placeholder="nom@exemple.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-400" aria-live="polite">
                    {errors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="sporty-label">
                  Mot de passe
                </label>
                <div className="relative mt-1">
                  <svg
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V7.5a4.5 4.5 0 00-9 0v3m-2.25 0h13.5A2.25 2.25 0 0121 12.75v8.25A2.25 2.25 0 0118.75 23.25H5.25A2.25 2.25 0 013 21V12.75A2.25 2.25 0 015.25 10.5z" />
                  </svg>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    className="sporty-input pl-11 pr-11"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition pointer-events-auto"
                    aria-pressed={showPassword}
                    aria-label={showPassword ? 'Masquer' : 'Afficher'}
                  >
                    {showPassword ? (
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12a10.477 10.477 0 0019.132 0A10.477 10.477 0 0020.02 8.223m-16.04 0L3 7m17.02 1.223L21 7M4.5 4.5l15 15M9.878 9.878a3 3 0 104.243 4.243" />
                      </svg>
                    ) : (
                      <svg
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        aria-hidden="true"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                
                {/* Strength Meter */}
                <div className="mt-2 flex space-x-1" aria-hidden="true">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-all duration-300 ${
                        strength === 0
                          ? 'bg-white/10'
                          : strength === 1
                          ? i < 1
                            ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]'
                            : 'bg-white/10'
                          : strength === 2
                          ? i < 2
                            ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]'
                            : 'bg-white/10'
                          : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'
                      }`}
                    ></div>
                  ))}
                </div>
                <p className="mt-1.5 text-xxs text-slate-500 font-bold uppercase tracking-wider">Au moins 8 caractères</p>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-400" aria-live="polite">
                    {errors.password}
                  </p>
                )}
              </div>

              <div>
                <label className="inline-flex items-center text-sm text-slate-300 cursor-pointer">
                  <input
                    id="terms"
                    name="terms"
                    type="checkbox"
                    checked={form.terms}
                    onChange={handleChange}
                    className="rounded border-white/10 bg-slate-900/60 text-indigo-600 focus:ring-indigo-500/50"
                  />
                  <span className="ml-2">J’accepte les Conditions Générales</span>
                </label>
                {errors.terms && (
                  <p className="mt-1 text-sm text-red-400" aria-live="polite">
                    {errors.terms}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isDisabled}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                    ></path>
                  </svg>
                ) : (
                  "S'inscrire"
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-400">
              Déjà inscrit ?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-semibold transition">
                Connectez-vous
              </Link>
            </p>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}

