import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import api from '../../src/api';
import PageTransition from '../components/PageTransition';
import { useNavigate } from 'react-router-dom';
import { KmOverTimeChart, ExpenseTypePieChart, CumulativeExpenseChart, CostPer100KmChart, CostPerLiterChart, MonthlyExpenseBarChart, AverageKmCard, AnnualBudgetEstimate, AverageConsumptionChart } from '../components/Charts';
import { API_URL } from '../../src/config';

export default function VehicleDetails() {
    const { id } = useParams();
    const [vehicle, setVehicle] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [expensesWithAcquisition, setExpensesWithAcquisition] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const [vehRes, expRes] = await Promise.all([
                    api.get(`/api/vehicles/${id}`),
                    api.get(`/api/expenses/${id}`),
                ]);

                const veh = vehRes.data;
                const expensesFromApi = expRes.data;

                let withAcquisition = [...expensesFromApi];

                if (veh.acquisitionDate) {
                    withAcquisition = [
                        ...withAcquisition,
                        {
                            _id: `acquisition-${veh._id}`,
                            type: 'acquisition',
                            label: 'Acquisition',
                            amount: 0,
                            km: veh.initialKm,
                            date: veh.acquisitionDate,
                        },
                    ];
                }

                withAcquisition.sort((a, b) => new Date(a.date) - new Date(b.date));

                setVehicle(veh);
                setExpenses(expensesFromApi.sort((a, b) => new Date(a.date) - new Date(b.date)));
                setExpensesWithAcquisition(withAcquisition);
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
                        <div className="flex gap-2 mt-4">
                            <button
                                onClick={() => navigate(`/vehicle/${vehicle._id}/add-expense`)}
                                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                            >
                                + Ajouter une dépense
                            </button>
                            <button
                                onClick={() => navigate(`/vehicle/${vehicle._id}/edit`)}
                                className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
                            >
                                Modifier
                            </button>
                        </div>

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
                <div className="grid gap-6 md:grid-cols-2">
                    <KmOverTimeChart data={expensesWithAcquisition} />
                    <ExpenseTypePieChart data={expenses} />
                    <CumulativeExpenseChart data={expenses} />
                    <CostPer100KmChart data={expenses} />
                    <CostPerLiterChart data={expenses} />
                    <AverageConsumptionChart data={expenses} />
                    <MonthlyExpenseBarChart data={expenses} />
                    <AverageKmCard data={expensesWithAcquisition} />
                    <AnnualBudgetEstimate data={expenses} />
                </div>

            </div>
        </PageTransition>
    );


}
