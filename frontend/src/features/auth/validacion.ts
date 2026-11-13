/** Validaciones del lado del cliente. Repiten las reglas del backend para avisar antes de enviar. */

export const REGLA_CONTRASENA = 'De 8 a 72 caracteres, con al menos una letra y un número.';

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validarCorreo(email: string): string | undefined {
  if (!email.trim()) return 'Escribe tu correo electrónico.';
  if (!PATRON_CORREO.test(email.trim())) {
    return 'El correo electrónico no es válido. Ejemplo: nombre@correo.com';
  }
  return undefined;
}

export function validarContrasenaNueva(password: string): string | undefined {
  if (!password) return 'Escribe una contraseña.';
  if (password.length < 8 || password.length > 72) return `La contraseña no cumple: ${REGLA_CONTRASENA}`;
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(password) || !/\d/.test(password)) {
    return `La contraseña no cumple: ${REGLA_CONTRASENA}`;
  }
  return undefined;
}

export interface FormularioRegistro {
  nombre: string;
  email: string;
  password: string;
  confirmacion: string;
  aceptaAviso: boolean;
}

export type ErroresRegistro = Partial<Record<keyof FormularioRegistro, string>>;

export function validarRegistro(datos: FormularioRegistro): ErroresRegistro {
  const errores: ErroresRegistro = {};
  if (!datos.nombre.trim()) errores.nombre = 'Escribe tu nombre.';
  else if (datos.nombre.trim().length > 120) errores.nombre = 'El nombre puede tener máximo 120 caracteres.';
  const correo = validarCorreo(datos.email);
  if (correo) errores.email = correo;
  const contrasena = validarContrasenaNueva(datos.password);
  if (contrasena) errores.password = contrasena;
  else if (datos.confirmacion !== datos.password) errores.confirmacion = 'Las contraseñas no coinciden.';
  if (!datos.aceptaAviso) errores.aceptaAviso = 'Debes aceptar el aviso de privacidad para crear la cuenta.';
  return errores;
}

export interface FormularioIngreso {
  email: string;
  password: string;
}

export function validarIngreso(datos: FormularioIngreso): Partial<Record<keyof FormularioIngreso, string>> {
  const errores: Partial<Record<keyof FormularioIngreso, string>> = {};
  const correo = validarCorreo(datos.email);
  if (correo) errores.email = correo;
  if (!datos.password) errores.password = 'Escribe tu contraseña.';
  return errores;
}
