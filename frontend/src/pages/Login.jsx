import React, { useState } from 'react';
import api from '../../src/api';
import { API_URL } from '../../src/config';
import GoogleIcon from '../assets/google.svg';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import PageTransition from '../components/PageTransition';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const res = await api.post('/api/auth/login', form);
      localStorage.setItem('token', res.data.token);
      const from = location.state?.from?.pathname || '/';
      setTimeout(() => navigate(from), 1000);
    } catch (err) {
      setError('Identifiants invalides');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#080b10] flex flex-col justify-center items-center relative overflow-hidden px-4 py-10">
        <div className="absolute inset-0 app-texture opacity-80" />

        <main className="w-full max-w-md z-10">
          <div className="glass-card p-8 space-y-8 border border-white/5 relative overflow-hidden">
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-teal-400 via-blue-500 to-amber-400" />
            <div className="absolute -top-8 left-1/2 -translate-x-1/2 p-4 bg-gradient-to-br from-teal-500 to-amber-500 rounded-lg shadow-xl shadow-teal-500/15">
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
              <h1 className="text-3xl font-black bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-300 tracking-tight">Connexion</h1>
              <p className="text-sm text-slate-400">Bienvenue sur CarCare Manager</p>
            </div>

            <button
              type="button"
              onClick={() => (window.location.href = `${API_URL}/api/auth/google`)}
              className="w-full h-12 flex items-center justify-center gap-3 border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 rounded-lg transition duration-200 shadow-sm"
            >
              <img src={GoogleIcon} alt="" className="w-5 h-5" />
              <span className="font-semibold text-sm">Continuer avec Google</span>
            </button>

            <div className="flex items-center my-4">
              <div className="flex-1 border-t border-white/10"></div>
              <span className="px-3 text-xs text-slate-500 font-bold uppercase tracking-widest">OU</span>
              <div className="flex-1 border-t border-white/10"></div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8m-18 8V8a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                    />
                  </svg>
                  <input
                    id="email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    autoFocus
                    required
                    onChange={handleChange}
                    className="sporty-input pl-11"
                    placeholder="nom@exemple.com"
                  />
                </div>
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
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16.5 10.5V7.5a4.5 4.5 0 00-9 0v3m-2.25 0h13.5A2.25 2.25 0 0121 12.75v8.25A2.25 2.25 0 0118.75 23.25H5.25A2.25 2.25 0 013 21V12.75A2.25 2.25 0 015.25 10.5z"
                    />
                  </svg>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    required
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3.98 8.223A10.477 10.477 0 001.934 12a10.477 10.477 0 0019.132 0A10.477 10.477 0 0020.02 8.223m-16.04 0L3 7m17.02 1.223L21 7M4.5 4.5l15 15M9.878 9.878a3 3 0 104.243 4.243"
                        />
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
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12s-3.75 6.75-9.75 6.75S2.25 12 2.25 12z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="rounded border-white/10 bg-slate-900/60 text-teal-500 focus:ring-teal-500/50"
                  />
                  <span className="ml-2 text-slate-300">Se souvenir de moi</span>
                </label>
                <Link
                  to="/forgot-password"
                  className="text-teal-300 hover:text-teal-200 font-semibold transition"
                >
                  Mot de passe oublié ?
                </Link>
              </div>

              {error && (
                <div
                  className="text-sm text-red-200 bg-red-900/30 border border-red-500/30 rounded-xl px-4 py-2.5"
                  aria-live="polite"
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 rounded-lg bg-gradient-to-r from-teal-500 via-blue-600 to-amber-500 text-white font-bold shadow-lg shadow-teal-500/15 hover:shadow-teal-500/25 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
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
                  'Se connecter'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-400">
              Pas encore de compte ?{' '}
              <Link to="/register" className="text-teal-300 hover:text-teal-200 font-semibold transition">
                Créer un compte
              </Link>
            </p>
          </div>
        </main>
      </div>
    </PageTransition>
  );
}
