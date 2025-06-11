import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import PageTransition from '../components/PageTransition';

export default function VehicleDetails() {
    const { id } = useParams();
    const [vehicle, setVehicle] = useState(null);
    const [expenses, setExpenses] = useState([]);

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const token = localStorage.getItem('token');
                const [vehRes, expRes] = await Promise.all([
                    axios.get(`http://localhost:5000/api/vehicles/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                    axios.get(`http://localhost:5000/api/expenses/${id}`, {
                        headers: { Authorization: `Bearer ${token}` },
                    }),
                ]);
                setVehicle(vehRes.data);
                setExpenses(expRes.data);
            } catch (err) {
                console.error('Erreur de chargement :', err);
            }
        };

        fetchDetails();
    }, [id]);

    if (!vehicle) return <p className="text-center mt-20">Chargement...</p>;

    return (
        <PageTransition>
            <div className="max-w-5xl mx-auto mt-10 px-4">
                <div className="bg-white rounded-lg shadow p-6 grid md:grid-cols-2 gap-6 items-center">
                    {/* Colonne Infos */}
                    <div>
                        <h1 className="text-3xl font-bold mb-2">{vehicle.name}</h1>
                        <p className="text-gray-700 text-lg mb-1">
                            {vehicle.brand} {vehicle.model} ({vehicle.year})
                        </p>
                        <p className="text-sm text-gray-500 mb-4">
                            Km initial : {vehicle.initialKm}
                        </p>

                        <h2 className="text-xl font-semibold mb-2 mt-6">Dépenses</h2>
                        {expenses.length === 0 ? (
                            <p className="text-gray-600">Aucune dépense enregistrée.</p>
                        ) : (
                            <ul className="space-y-2">
                                {expenses.map((exp) => (
                                    <li
                                        key={exp._id}
                                        className="bg-gray-50 p-3 rounded border-l-4 border-indigo-500"
                                    >
                                        <strong>{exp.label}</strong> — {exp.amount} €
                                        <div className="text-sm text-gray-500">
                                            {exp.type} • {new Date(exp.date).toLocaleDateString()} • {exp.km} km
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Colonne Image */}
                    {vehicle.image && (
                        <div>
                            <img
                                src={`http://localhost:5000${vehicle.image}`}
                                alt={vehicle.name}
                                className="w-full h-auto rounded-lg object-cover shadow"
                            />
                        </div>
                    )}
                </div>
            </div>
        </PageTransition>
    );


}
