import React, { useEffect, useState } from 'react';
import { imageFileError } from '../lib/forms';
import { vehicleImageUrl } from '../config';

const sections = [
  { title: 'Votre véhicule', fields: [
    { name: 'name', label: 'Nom du véhicule', placeholder: 'Ma voiture du quotidien', required: true },
    { name: 'brand', label: 'Marque', placeholder: 'Peugeot', required: true },
    { name: 'model', label: 'Modèle', placeholder: '208', required: true },
    { name: 'year', label: 'Année', type: 'number', min: 1900, max: new Date().getFullYear() + 1, step: 1, required: true },
  ] },
  { title: 'Les informations utiles', fields: [
    { name: 'initialKm', label: 'Kilométrage initial (km)', type: 'number', min: 0, step: 1, required: true },
    { name: 'tankSize', label: 'Réservoir (L)', type: 'number', min: 0.01, step: 0.01, placeholder: '50' },
    { name: 'plate', label: 'Immatriculation', placeholder: 'AA-123-BB' },
    { name: 'vin', label: 'Numéro de châssis (VIN)', placeholder: '17 caractères', maxLength: 17 },
    { name: 'acquisitionDate', label: 'Date d’acquisition', type: 'date' },
  ] },
];

export default function VehicleForm({ vehicle, setVehicle, onSubmit, saving, file, setFile, image, message, submitLabel, onCancel }) {
  const [preview, setPreview] = useState('');
  const [fileError, setFileError] = useState('');
  useEffect(() => {
    if (!file) { setPreview(''); return; }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);
  const handleFile = (event) => {
    const selected = event.target.files?.[0];
    const error = imageFileError(selected);
    setFileError(error);
    if (error) { event.target.value = ''; return; }
    if (selected) setFile(selected);
  };
  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="grid gap-8 md:grid-cols-2">
        {sections.map(section => (
          <fieldset key={section.title} className="space-y-4 min-w-0">
            <legend className="text-sm font-bold text-slate-300 border-b border-white/10 pb-3 mb-4 w-full">{section.title}</legend>
            {section.fields.map(({ label, name, ...attributes }) => (
              <div key={name} className="space-y-1.5">
                <label htmlFor={`vehicle-${name}`} className="sporty-label">{label}{attributes.required && <span aria-hidden="true"> *</span>}</label>
                <input {...attributes} id={`vehicle-${name}`} name={name} value={vehicle[name]} className="sporty-input" onChange={event => setVehicle(current => ({ ...current, [name]: event.target.value }))} />
              </div>
            ))}
          </fieldset>
        ))}
      </div>
      <div className="rounded-xl border border-dashed border-white/20 p-5 space-y-3">
        <label htmlFor="vehicle-image" className="sporty-label">Photo du véhicule</label>
        {(preview || image) && <img src={preview || vehicleImageUrl(image)} alt="Aperçu du véhicule" className="h-36 w-full object-contain rounded-lg" />}
        <input id="vehicle-image" name="image" type="file" accept="image/jpeg,image/png,image/gif,image/webp" onChange={handleFile} className="text-sm text-slate-400 w-full" />
        <p className="text-xs text-slate-500">JPG, PNG, GIF ou WEBP · 5 Mo maximum</p>
        {fileError && <p role="alert" className="text-sm text-red-400">{fileError}</p>}
      </div>
      {message && <p role="alert" className="text-sm text-red-400">{message}</p>}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 border-t border-white/10 pt-5">
        <button type="button" onClick={onCancel} disabled={saving} className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-300">Annuler</button>
        <button type="submit" disabled={saving} className="rounded-xl bg-indigo-600 hover:bg-indigo-500 px-6 py-3 text-sm font-bold text-white disabled:opacity-60">{saving ? 'Enregistrement…' : submitLabel}</button>
      </div>
    </form>
  );
}
