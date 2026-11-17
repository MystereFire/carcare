export function expensePayload(form) {
  const amount = Number(form.amount);
  const km = Number(form.km);
  const liters = form.type === 'fuel' && form.liters !== '' && form.liters != null ? Number(form.liters) : null;
  if (!form.label?.trim()) throw new Error('Indiquez un libellé.');
  if (!['fuel', 'maintenance', 'repair'].includes(form.type)) throw new Error('Type de dépense invalide.');
  if (form.amount === '' || !Number.isFinite(amount) || amount <= 0) throw new Error('Le montant doit être supérieur à zéro.');
  if (form.km === '' || form.km == null || !Number.isSafeInteger(km) || km < 0) throw new Error('Indiquez un kilométrage entier positif ou nul.');
  const date = String(form.date || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(new Date(date).getTime()) || new Date(date).toISOString().slice(0, 10) !== date) throw new Error('Indiquez une date valide.');
  if (liters != null && (!Number.isFinite(liters) || liters <= 0)) throw new Error('Le volume de carburant doit être supérieur à zéro.');
  if (form.type === 'fuel' && form.isFullFill && liters == null) throw new Error('Indiquez les litres pour enregistrer un plein complet.');
  return {
    type: form.type, label: form.label.trim(), amount, date, km, liters,
    isFullFill: form.type === 'fuel' && !!form.isFullFill,
    notes: form.notes || '',
  };
}

export function imageFileError(file) {
  if (!file) return '';
  if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) return 'Choisissez une image JPG, PNG, GIF ou WEBP.';
  if (file.size > 5 * 1024 * 1024) return 'L’image doit peser moins de 5 Mo.';
  return '';
}

export const emptyVehicle = {
  name: '', brand: '', model: '', year: '', plate: '', vin: '',
  tankSize: '', initialKm: '', acquisitionDate: '',
};

export function vehicleFormData(vehicle, file) {
  for (const key of ['name', 'brand', 'model']) {
    if (!String(vehicle[key] || '').trim()) throw new Error('Renseignez le nom, la marque et le modèle.');
  }
  const year = Number(vehicle.year);
  if (!Number.isInteger(year) || year < 1900 || year > new Date().getFullYear() + 1) throw new Error('Indiquez une année valide.');
  const initialKm = Number(vehicle.initialKm);
  if (vehicle.initialKm === '' || !Number.isSafeInteger(initialKm) || initialKm < 0) throw new Error('Indiquez un kilométrage entier positif ou nul.');
  if (vehicle.tankSize !== '' && vehicle.tankSize != null && (!Number.isFinite(Number(vehicle.tankSize)) || Number(vehicle.tankSize) <= 0)) throw new Error('La capacité du réservoir doit être supérieure à zéro.');
  const fileError = imageFileError(file);
  if (fileError) throw new Error(fileError);
  const data = new FormData();
  Object.entries(vehicle).forEach(([key, value]) => {
    if (key in emptyVehicle) data.append(key, value == null ? '' : String(value).trim());
  });
  if (file) data.append('image', file);
  return data;
}
