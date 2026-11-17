import axios from 'axios';
import { API_URL } from './config';

const api = axios.create({
  baseURL: API_URL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const errResponse = error.response;
    const currentToken = localStorage.getItem('token');
    const requestHeaders = error.config?.headers;
    const requestToken = requestHeaders?.get?.('Authorization') || requestHeaders?.Authorization || requestHeaders?.authorization;
    if (errResponse && errResponse.status === 401 && currentToken && requestToken === `Bearer ${currentToken}` && !['/api/auth/login', '/api/auth/register'].includes(error.config?.url)) {
      // Token invalide ou expiré : on supprime le jeton et on redirige vers la page de connexion
      localStorage.removeItem('token');
      localStorage.removeItem('currentVehicleId');
      window.location.assign('/login');
    }
    return Promise.reject(error);
  }
);

export default api;
