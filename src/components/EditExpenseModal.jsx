import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { expensePayload } from '../lib/forms';
import { useDialog } from '../lib/useDialog';

export default function EditExpenseModal({ expense, onClose, onSave }) {
    const [form, setForm] = useState(expense || {});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const dialogRef = useDialog(!!expense, () => { if (!saving) onClose(); });

    useEffect(() => {
        setForm(expense); // Réinitialise si expense change
    }, [expense]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        if (type === 'checkbox') {
            setForm({ ...form, [name]: checked });
        } else {
            const updated = { ...form, [name]: value };
            if (name === 'type' && value !== 'fuel') {
                updated.liters = '';
                updated.isFullFill = false;
            }
            setForm(updated);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (saving) return;
        setError('');
        setSaving(true);
        try {
            await onSave({ _id: expense._id, ...expensePayload(form) });
        } catch (err) {
            setError(err.response?.data?.error || err.message || 'Impossible de modifier la dépense.');
        } finally {
            setSaving(false);
        }
    };

    if (!expense) return null;

    return createPortal(
        <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby="edit-expense-title" className="app-modal fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
            <div className="app-surface rounded-lg p-6 sm:p-8 w-full max-w-md max-h-[calc(100dvh-2rem)] overflow-y-auto shadow-2xl text-slate-100">
                <h2 id="edit-expense-title" className="text-xl font-black text-slate-100 mb-6 tracking-tight">Modifier la dépense</h2>
                {error && <p role="alert" className="text-red-400 mb-4">{error}</p>}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1">
                        <label htmlFor="editexpensemodal-type" className="sporty-label">Type</label>
                        <select id="editexpensemodal-type" name="type" value={form.type} onChange={handleChange} className="sporty-input bg-slate-950">
                            <option value="fuel" className="bg-slate-900 text-slate-100">Essence</option>
                            <option value="maintenance" className="bg-slate-900 text-slate-100">Entretien</option>
                            <option value="repair" className="bg-slate-900 text-slate-100">Réparation</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="editexpensemodal-label" className="sporty-label">Libellé</label>
                        <input id="editexpensemodal-label" type="text" name="label" value={form.label} onChange={handleChange} className="sporty-input" required />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="editexpensemodal-amount" className="sporty-label">Montant (€)</label>
                        <input id="editexpensemodal-amount" type="number" inputMode="decimal" step="0.01" name="amount" value={form.amount} onChange={handleChange} className="sporty-input" required />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="editexpensemodal-date" className="sporty-label">Date</label>
                        <input id="editexpensemodal-date" type="date" name="date" value={form.date?.slice(0, 10)} onChange={handleChange} className="sporty-input" required />
                    </div>

                    <div className="space-y-1">
                        <label htmlFor="editexpensemodal-km" className="sporty-label">Kilométrage</label>
                        <input id="editexpensemodal-km" type="number" name="km" value={form.km} onChange={handleChange} className="sporty-input" required />
                    </div>

                    {form.type === 'fuel' && (
                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label htmlFor="editexpensemodal-liters" className="sporty-label">Litres</label>
                                <input id="editexpensemodal-liters"
                                    type="number"
                                    inputMode="decimal"
                                    step="0.01"
                                    name="liters"
                                    value={form.liters || ''}
                                    onChange={handleChange}
                                    className="sporty-input"
                                    placeholder="Litres"
                                />
                            </div>
                            <label className="flex items-center gap-2 text-sm text-slate-350 cursor-pointer">
                                <input
                                    type="checkbox"
                                    name="isFullFill"
                                    checked={form.isFullFill || false}
                                    onChange={handleChange}
                                    className="rounded border-white/10 bg-slate-900/60 text-indigo-600 focus:ring-indigo-500/50"
                                />
                                Plein effectué
                            </label>
                        </div>
                    )}

                    <div className="space-y-1">
                        <label htmlFor="editexpensemodal-notes" className="sporty-label">Notes (optionnel)</label>
                        <textarea id="editexpensemodal-notes" name="notes" value={form.notes || ''} onChange={handleChange} className="sporty-input py-3 h-24" placeholder="Notes (optionnel)" />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <button type="button" onClick={onClose} disabled={saving} className="px-5 py-2.5 rounded-xl font-bold text-slate-400 hover:text-slate-200 bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-sm">Annuler</button>
                        <button type="submit" disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 hover:-translate-y-0.5 transition-all text-sm">{saving ? 'Enregistrement…' : 'Enregistrer'}</button>
                    </div>
                </form>
            </div>
        </div>
    , document.body);
}
