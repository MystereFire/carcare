import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import AuthLayout from '../components/AuthLayout';
import Icon from '../components/Icon';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();
  useEffect(() => { document.title = 'Créer un compte · CarCare'; }, []);
  const change = e => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  const submit = async event => {
    event.preventDefault();
    if (loading) return;
    if (!form.name.trim()) { setError('Renseignez votre nom.'); return; }
    if (new TextEncoder().encode(form.password).length > 72) { setError('Votre mot de passe est trop long (72 octets maximum).'); return; }
    setLoading(true); setError('');
    try {
      await api.post('/api/auth/register', { name: form.name.trim(), email: form.email.trim(), password: form.password });
      navigate('/login', { replace: true, state: { registered: true, email: form.email.trim() } });
    } catch (err) {
      setError(err.response?.data?.error || 'Votre compte n’a pas pu être créé. Vérifiez votre connexion et réessayez.');
      setLoading(false);
    }
  };
  return <AuthLayout><span className="eyebrow">VOTRE GARAGE VOUS ATTEND</span><h1>Un bon départ pour votre auto.</h1><p className="auth-intro">Créez votre compte et commencez un suivi qui dure.</p>{error && <p className="inline-error" role="alert">{error}</p>}<form className="auth-form" onSubmit={submit}><div><label className="sporty-label" htmlFor="name">Votre nom</label><input className="sporty-input" id="name" name="name" autoComplete="name" maxLength={100} required value={form.name} onChange={change} placeholder="Comment vous appelez-vous ?" /></div><div><label className="sporty-label" htmlFor="email">Adresse e-mail</label><input className="sporty-input" id="email" type="email" name="email" autoComplete="username" maxLength={254} required value={form.email} onChange={change} placeholder="vous@exemple.fr" /></div><div><label className="sporty-label" htmlFor="password">Mot de passe</label><div className="password-field"><input className="sporty-input" id="password" name="password" type={visible ? 'text' : 'password'} autoComplete="new-password" required minLength={8} maxLength={72} value={form.password} onChange={change} placeholder="Choisissez votre mot de passe" aria-describedby="password-hint" /><button type="button" aria-label={visible ? 'Masquer le mot de passe' : 'Afficher le mot de passe'} aria-pressed={visible} onClick={() => setVisible(v => !v)}><Icon name="eye" size={19} /></button></div><p className="auth-field-hint" id="password-hint">Au moins 8 caractères.</p></div><button className="btn-primary" disabled={loading}><span>{loading ? 'Création du compte…' : 'Créer mon compte'}</span>{loading ? <span className="loading-ring" /> : <Icon name="arrow" size={18} />}</button></form><p className="auth-bottom">Déjà un compte ? <Link to="/login">Se connecter</Link></p></AuthLayout>;
}
