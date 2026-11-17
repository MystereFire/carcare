import api from '../api';

export async function getAllVehicles(config = {}) {
  const vehicles = [];
  let page = 1;
  let totalPages = 1;
  do {
    const response = await api.get('/api/vehicles', {
      ...config, params: { ...config.params, page, limit: 100 },
    });
    const payload = response.data;
    if (!Array.isArray(payload?.data)) throw new Error('Réponse du garage invalide.');
    vehicles.push(...payload.data);
    totalPages = Number(payload.totalPages) || 1;
    page += 1;
  } while (page <= totalPages);
  return vehicles;
}

export async function getAllExpenses(vehicleId, config = {}) {
  const response = await api.get('/api/expenses', {
    ...config, params: { ...config.params, vehicleId },
  });
  if (!Array.isArray(response.data)) throw new Error('Réponse des dépenses invalide.');
  return response.data;
}
