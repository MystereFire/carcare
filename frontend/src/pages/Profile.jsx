import React, { useEffect, useState } from 'react';
import api from '../api';
import PageTransition from '../components/PageTransition';

export default function Profile() {
  const [user, setUser] = useState(null);
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

    fetchUser();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');

    if (form.newPassword !== form.confirmNewPassword) {
      setMessage('❌ Les mots de passe ne correspondent pas');
      return;
    }

    try {
      await api.put('/api/auth/password', {
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      setMessage('✅ Mot de passe modifié');
      setForm({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
      setMessage('❌ Erreur lors du changement de mot de passe');
    }
  };

  return (
    <PageTransition>
      <div className="max-w-md mx-auto p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Mon profil</h2>
        {user && (
          <div className="mb-6">
            <p className="font-semibold">{user.name}</p>
            <p className="text-sm text-gray-600">{user.email}</p>
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            name="currentPassword"
            placeholder="Mot de passe actuel"
            value={form.currentPassword}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            name="newPassword"
            placeholder="Nouveau mot de passe"
            value={form.newPassword}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
          <input
            type="password"
            name="confirmNewPassword"
            placeholder="Confirmez le nouveau mot de passe"
            value={form.confirmNewPassword}
            onChange={handleChange}
            className="w-full p-2 border rounded"
            required
          />
          <button className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">
            Changer le mot de passe
          </button>
        </form>
        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </PageTransition>
  );
}
