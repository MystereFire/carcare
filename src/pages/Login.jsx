import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../api';
import { API_URL } from '../config';
import AuthLayout from '../components/AuthLayout';
import Icon from '../components/Icon';
import GoogleIcon from '../assets/google.svg';

export default function Login() {
  const location = useLocation();
  const navigate = useNavigate();
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  useEffect(() => { document.title = 'Connexion · CarCare'; }, []);
  const submit = async event => {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const response = await api.post('/api/auth/login', { email: email.trim(), password });
      if (!response.data?.token || typeof response.data.token !== 'string') throw new Error('Session invalide');
      localStorage.setItem('token', response.data.token);
      const from = location.state?.from;
      const target = from?.pathname?.startsWith('/') && !from.pathname.startsWith('//') ? `${from.pathname}${from.search || ''}` : '/';
      navigate(target, { replace: true });
    } catch (err) {
      setError(err.response?.status === 401 ? 'Identifiants invalides. Vérifiez votre adresse e-mail et votre mot de passe.' : err.response?.data?.error || 'Connexion impossible. Vérifiez que le serveur est disponible et réessayez.');
      setLoading(false);
    }
  };
  return <AuthLayout><span className="eyebrow">BIENVENUE À BORD</span><h1>Heureux de vous retrouver.</h1><p className="auth-intro">Connectez-vous pour reprendre le suivi de vos véhicules.</p>{location.state?.registered && <p className="success-message" role="status">Votre compte est créé. Vous pouvez maintenant vous connecter.</p>}{error && <p className="inline-error" role="alert">{error}</p>}{import.meta.env.VITE_GOOGLE_AUTH_ENABLED === 'true' && <><button className="btn-secondary google-button" onClick={() => window.location.assign(`${API_URL}/api/auth/google`)}><img src={GoogleIcon} width="17" height="17" alt="" />Continuer avec Google</button><div className="auth-divider">ou avec votre adresse e-mail</div></>}<form className="auth-form" onSubmit={submit}><div><label htmlFor="email" className="sporty-label">Adresse e-mail</label><input id="email" type="email" name="email" className="sporty-input" autoComplete="username" required maxLength={254} placeholder="vous@exemple.fr" value={email} onChange={e => setEmail(e.target.value)} /></div><div><label htmlFor="password" className="sporty-label">Mot de passe</label><div className="password-field"><input id="password" name="password" type={visible ? 'text' : 'password'} className="sporty-input" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Votre mot de passe" /><button type="button" aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={visible} onClick={() => setVisible(v => !v)}><Icon name="eye" size={19} /></button></div></div><button className="btn-primary" type="submit" disabled={loading}><span>{loading ? 'Connexion…' : 'Se connecter'}</span>{loading ? <span className="loading-ring" /> : <Icon name="arrow" size={18} />}</button></form><p className="auth-bottom">Pas encore de compte ? <Link to="/register">Créer un compte</Link></p></AuthLayout>;
}
