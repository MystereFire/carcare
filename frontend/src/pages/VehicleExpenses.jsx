import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import PageTransition from '../components/PageTransition';
import EditExpenseModal from '../components/EditExpenseModal';
import { API_URL } from '../../src/config';


export default function VehicleExpenses() {
    const { id } = useParams(); // vehicleId
    const navigate = useNavigate();
    const [expenses, setExpenses] = useState([]);
    const [vehicle, setVehicle] = useState(null);
    const [filter, setFilter] = useState('all');
    const [editExpense, setEditExpense] = useState(null);

    const handleDelete = async (expenseId) => {
        if (!window.confirm('Supprimer cette dépense ?')) return;
        try {
            await axios.delete(`${API_URL}/api/expenses/${expenseId}`, {
                headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
            });
            setExpenses((prev) => prev.filter((e) => e._id !== expenseId));
        } catch (err) {
            console.error('Erreur suppression :', err);
            alert("Erreur lors de la suppression");
        }
    };


    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = localStorage.getItem('token');
                const [vehRes, expRes] = await Promise.all([
                    axios.get(`${API_URL}/api/vehicles/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`${API_URL}/api/expenses/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                setVehicle(vehRes.data);
                setExpenses(expRes.data.reverse()); // + récent en haut
            } catch (err) {
                console.error('Erreur chargement données', err);
            }
        };
        fetchData();
    }, [id]);

    const filtered = filter === 'all' ? expenses : expenses.filter(e => e.type === filter);

    return (
        <PageTransition>
            <div className="max-w-3xl mx-auto mt-10 px-4">
                <button
                    onClick={() => navigate(`/vehicle/${id}`)}
                    className="mb-4 text-sm text-blue-600 hover:underline"
                >
                    ← Retour au véhicule
                </button>

                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h1 className="text-2xl font-bold">{vehicle?.name}</h1>
                        <p className="text-gray-500 text-sm">{vehicle?.brand} {vehicle?.model}</p>
                    </div>
                    <button
                        onClick={() => navigate(`/vehicle/${id}/add-expense`)}
                        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                        + Ajouter une dépense
                    </button>
                </div>

                <div className="mb-4">
                    <label className="text-sm font-semibold mr-2">Filtrer :</label>
                    <select
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        className="border px-2 py-1 rounded"
                    >
                        <option value="all">Toutes</option>
                        <option value="fuel">Essence</option>
                        <option value="maintenance">Entretien</option>
                        <option value="repair">Réparation</option>
                    </select>
                </div>

                {filtered.length === 0 ? (
                    <p className="text-gray-600">Aucune dépense enregistrée.</p>
                ) : (
                    <ul className="space-y-3">
                        {filtered.map((exp) => (
                            <li
                                key={exp._id}
                                className="bg-white p-3 rounded shadow-sm border-l-4 border-indigo-500"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <div className="font-medium">{exp.label} — {exp.amount} €</div>
                                        <div className="text-sm text-gray-500">
                                            {exp.type} • {new Date(exp.date).toLocaleDateString()} • {exp.km} km
                                        </div>
                                    </div>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={() => setEditExpense(exp)}
                                            className="text-blue-600 text-sm hover:underline"
                                        >
                                            Modifier
                                        </button>

                                        <button
                                            onClick={() => handleDelete(exp._id)}
                                            className="text-red-600 text-sm hover:underline"
                                        >
                                            Supprimer
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>

                )}
                {editExpense && (
                    <EditExpenseModal
                        expense={editExpense}
                        onClose={() => setEditExpense(null)}
                        onSave={async (updated) => {
                            try {
                                const res = await axios.put(
                                    `${API_URL}/api/expenses/${updated._id}`,
                                    updated,
                                    {
                                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
                                    }
                                );
                                setExpenses((prev) =>
                                    prev.map((e) => (e._id === updated._id ? res.data : e))
                                );
                                setEditExpense(null);
                            } catch (err) {
                                alert("Erreur lors de la mise à jour");
                            }
                        }}
                    />
                )}
            </div>
        </PageTransition>
    );
}
