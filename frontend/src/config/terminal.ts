export const terminal = {
  nombre: import.meta.env.VITE_TERMINAL_NOMBRE || 'Sala General 04',
  codigo: import.meta.env.VITE_TERMINAL_CODIGO || 'T-04 (Piso 1)',
} as const;
