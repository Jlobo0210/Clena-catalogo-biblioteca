import axios, { type InternalAxiosRequestConfig } from 'axios';

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

/**
 * Enlace entre el cliente HTTP y la sesión (HU-18). La sesión registra aquí cómo
 * leer el access token y cómo renovarlo; el cliente no sabe nada más de autenticación.
 */
interface EnlaceSesion {
  obtenerAccessToken: () => string | null;
  /** Renueva la sesión y devuelve el nuevo access token, o null si ya no hay sesión. */
  renovarAccessToken: () => Promise<string | null>;
}

let enlace: EnlaceSesion | null = null;

export function conectarSesion(nuevoEnlace: EnlaceSesion): () => void {
  enlace = nuevoEnlace;
  return () => {
    if (enlace === nuevoEnlace) enlace = null;
  };
}

type ConfigConReintento = InternalAxiosRequestConfig & { _reintentado?: boolean };

/** Las rutas de /auth manejan sus propios 401 (credenciales malas, refresh vencido). */
const esRutaDeAuth = (url?: string) => Boolean(url?.startsWith('/auth/') && !url.startsWith('/auth/me'));

apiClient.interceptors.request.use((config) => {
  const token = enlace?.obtenerAccessToken();
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error) || !enlace) throw error;
  const config = error.config as ConfigConReintento | undefined;
  if (error.response?.status !== 401 || !config || config._reintentado || esRutaDeAuth(config.url)) {
    throw error;
  }

  // El access token venció: se renueva una vez y se repite la petición original.
  config._reintentado = true;
  const nuevoToken = await enlace.renovarAccessToken();
  if (!nuevoToken) throw error;
  config.headers.Authorization = `Bearer ${nuevoToken}`;
  return apiClient(config);
});
