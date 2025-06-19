import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../src/api';
import PageTransition from '../components/PageTransition';
import { useNavigate } from 'react-router-dom';
import { KmOverTimeChart, ExpenseTypePieChart, CumulativeExpenseChart, CostPer100KmChart, MonthlyExpenseBarChart, AverageKmCard, AnnualBudgetEstimate } from '../components/Charts';
import { API_URL } from '../../src/config';

export default function VehicleDetails() {
    const { id } = useParams();
    const [vehicle, setVehicle] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const [vehRes, expRes] = await Promise.all([
                    api.get(`/api/vehicles/${id}`),
                    api.get(`/api/expenses/${id}`),
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
                        <button
                            onClick={() => navigate(`/vehicle/${vehicle._id}/add-expense`)}
                            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                        >
                            + Ajouter une dépense
                        </button>

                        <h2 className="text-xl font-semibold mb-3">Dernière dépense</h2>
                        {expenses.length === 0 ? (
                            <p className="text-gray-600">Aucune dépense enregistrée.</p>
                        ) : (
                            <div className="bg-gray-50 p-3 rounded border-l-4 border-indigo-500 mb-4">
                                <strong>{expenses[expenses.length - 1].label}</strong> — {expenses[expenses.length - 1].amount} €
                                <div className="text-sm text-gray-500">
                                    {expenses[expenses.length - 1].type} • {new Date(expenses[expenses.length - 1].date).toLocaleDateString()} • {expenses[expenses.length - 1].km} km
                                </div>
                            </div>
                        )}
                        {expenses.length > 0 && (
                            <button
                                onClick={() => navigate(`/vehicle/${vehicle._id}/expenses`)}
                                className="text-blue-600 hover:underline text-sm"
                            >
                                → Voir toutes les dépenses
                            </button>
                        )}


                    </div>

                    {/* Colonne Image */}
                    {vehicle.image && (
                        <div>
                            <img
                                src={`${API_URL}${vehicle.image}`}
                                alt={vehicle.name}
                                className="w-full h-auto rounded-lg object-cover shadow"
                            />
                        </div>
                    )}
                </div>
                <div className="mb-6 pt-4"></div>
                <KmOverTimeChart data={expenses} />
                <ExpenseTypePieChart data={expenses} />
                <CumulativeExpenseChart data={expenses} />
                <CostPer100KmChart data={expenses} />
                <MonthlyExpenseBarChart data={expenses} />
                <AverageKmCard data={expenses} />
                <AnnualBudgetEstimate data={expenses} />

            </div>
        </PageTransition>
    );


}
