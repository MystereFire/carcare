import React, { useState, useEffect } from 'react';

export default function EditExpenseModal({ expense, onClose, onSave }) {
    const [form, setForm] = useState(expense || {});

    useEffect(() => {
        setForm(expense); // Réinitialise si expense change
    }, [expense]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        const updated = { ...form, [name]: value };
        if (name === 'type' && value !== 'fuel') {
            updated.liters = '';
        }
        setForm(updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        onSave(form);
    };

    if (!expense) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
                <h2 className="text-xl font-semibold mb-4">Modifier la dépense</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <select name="type" value={form.type} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="fuel">Essence</option>
                        <option value="maintenance">Entretien</option>
                        <option value="repair">Réparation</option>
                    </select>
                    <input type="text" name="label" value={form.label} onChange={handleChange} className="w-full p-2 border rounded" required />
                    <input type="number" inputMode="decimal" step="0.01" name="amount" value={form.amount} onChange={handleChange} className="w-full p-2 border rounded" required />
                    <input type="date" name="date" value={form.date?.slice(0, 10)} onChange={handleChange} className="w-full p-2 border rounded" required />
                    <input type="number" name="km" value={form.km} onChange={handleChange} className="w-full p-2 border rounded" required />
                    {form.type === 'fuel' && (
                        <input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            name="liters"
                            value={form.liters || ''}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                            placeholder="Litres"
                        />
                    )}
                    <textarea name="notes" value={form.notes || ''} onChange={handleChange} className="w-full p-2 border rounded" placeholder="Notes (optionnel)" />
                    <div className="flex justify-end gap-2">
                        <button type="button" onClick={onClose} className="px-4 py-2 text-gray-500 hover:underline">Annuler</button>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Enregistrer</button>
                    </div>
                </form>
            </div>
        </div>
    );
}
