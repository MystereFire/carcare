import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageTransition from '../components/PageTransition';

export default function AddExpense() {
  const { id } = useParams(); // vehicleId
  const navigate = useNavigate();
  const [expense, setExpense] = useState({
    type: 'fuel',
    label: '',
    amount: '',
    date: '',
    km: '',
    notes: ''
  });
  const [message, setMessage] = useState('');

  const handleChange = (e) => {
    setExpense({ ...expense, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:5000/api/expenses', {
        ...expense,
        vehicleId: id,
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
      });

      setMessage('✅ Dépense enregistrée');
      setTimeout(() => navigate(`/vehicle/${id}`), 1000);
    } catch (err) {
      setMessage('❌ Erreur lors de l’ajout');
    }
  };

  const handleCancel = () => {
    navigate(`/vehicle/${id}`);
  };

  return (
    <PageTransition>
      <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded shadow">
        <h2 className="text-2xl font-bold mb-4">Ajouter une dépense</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <select name="type" onChange={handleChange} className="w-full p-2 border rounded" value={expense.type}>
            <option value="fuel">Essence</option>
            <option value="maintenance">Entretien</option>
            <option value="repair">Réparation</option>
          </select>
          <input type="text" name="label" placeholder="Libellé" onChange={handleChange} className="w-full p-2 border rounded" required />
          <input type="number" inputMode="decimal" step="0.01" name="amount" placeholder="Montant (€)" onChange={handleChange} className="w-full p-2 border rounded" required />
          <input type="date" name="date" onChange={handleChange} className="w-full p-2 border rounded" required />
          <input type="number" name="km" placeholder="Kilométrage" onChange={handleChange} className="w-full p-2 border rounded" required />
          <textarea name="notes" placeholder="Notes (facultatif)" onChange={handleChange} className="w-full p-2 border rounded" />

          <div className="flex gap-2">
            <button type="button" onClick={handleCancel} className="w-full bg-gray-400 text-white p-2 rounded hover:bg-gray-500">Annuler</button>
            <button type="submit" className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700">Ajouter</button>
          </div>
        </form>
        {message && <p className="mt-4 text-center">{message}</p>}
      </div>
    </PageTransition>
  );
}
