import { describe, expect, it } from 'vitest';
import { validarContrasenaNueva, validarIngreso, validarRegistro } from './validacion';

const valido = {
  nombre: 'Ana Pérez',
  email: 'ana@example.com',
  password: 'clave-segura-1',
  confirmacion: 'clave-segura-1',
  aceptaAviso: true,
};

describe('validarRegistro', () => {
  it('acepta un formulario completo', () => {
    expect(validarRegistro(valido)).toEqual({});
  });

  it('exige aceptar el aviso de privacidad', () => {
    expect(validarRegistro({ ...valido, aceptaAviso: false }).aceptaAviso).toMatch(/aviso de privacidad/);
  });

  it('marca nombre vacío, correo inválido y contraseñas distintas', () => {
    const errores = validarRegistro({ ...valido, nombre: '  ', email: 'ana@', confirmacion: 'otra-clave-2' });
    expect(Object.keys(errores).sort()).toEqual(['confirmacion', 'email', 'nombre']);
  });
});

describe('validarContrasenaNueva', () => {
  it.each(['corta1', 'solo-letras', '12345678', 'a1'.repeat(37)])('rechaza «%s»', (clave) => {
    expect(validarContrasenaNueva(clave)).toBeDefined();
  });

  it('acepta letras con tilde y números', () => {
    expect(validarContrasenaNueva('canción2026')).toBeUndefined();
  });
});

describe('validarIngreso', () => {
  it('pide correo y contraseña', () => {
    expect(validarIngreso({ email: '', password: '' })).toEqual({
      email: 'Escribe tu correo electrónico.',
      password: 'Escribe tu contraseña.',
    });
  });
});
