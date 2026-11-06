import axios from 'axios';

/** URL base de la API (todas las rutas de negocio cuelgan de /api/v1). */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api/v1';

/** /health está fuera de /api/v1 en el backend, así que se arma desde el origen de la API. */
export const HEALTH_URL = new URL('/health', API_BASE_URL).toString();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});
