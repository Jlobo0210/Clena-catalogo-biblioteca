/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL base de la API, p. ej. http://localhost:3000/api/v1 */
  readonly VITE_API_BASE_URL?: string;
  /** Tiempo de espera de la API en ms (por defecto 5000; usar 20000 en producción). */
  readonly VITE_API_TIMEOUT_MS?: string;
  readonly VITE_TERMINAL_NOMBRE?: string;
  readonly VITE_TERMINAL_CODIGO?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
