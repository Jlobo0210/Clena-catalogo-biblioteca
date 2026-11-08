import { ValidationError } from '../../../../shared/domain/domain-error';
import { Email } from '../value-objects/email';
import { validarPassword } from '../value-objects/password';
import { Rol, esRol } from '../value-objects/rol';
import { Usuario } from './usuario';
import { refreshTokenVigente } from './refresh-token';

const base = {
  id: 'u-1',
  nombre: '  Ana   Pérez ',
  email: Email.crear('Ana@Example.com '),
  passwordHash: 'h',
  aceptaAvisoPrivacidad: true,
  versionAvisoPrivacidad: '1.0',
  ahora: new Date('2026-11-07T10:00:00Z'),
};

describe('Usuario', () => {
  it('se registra como PUBLICO y guarda fecha y versión del consentimiento', () => {
    const u = Usuario.registrarPublico(base);
    expect(u.rol).toBe(Rol.PUBLICO);
    expect(u.nombre).toBe('Ana Pérez');
    expect(u.email.valor).toBe('ana@example.com');
    expect(u.consentimientoPrivacidadEn).toEqual(base.ahora);
    expect(u.versionAvisoPrivacidad).toBe('1.0');
    expect(u.creadoEn).toEqual(base.ahora);
    expect(u.anonimizadoEn).toBeNull();
    expect(u.passwordHash).toBe('h');
    expect(u.id).toBe('u-1');
    expect(u.puedeIniciarSesion).toBe(true);
  });

  it('no se registra sin aceptar el aviso de privacidad', () => {
    expect(() =>
      Usuario.registrarPublico({ ...base, aceptaAvisoPrivacidad: false }),
    ).toThrow(ValidationError);
  });

  it('valida el nombre', () => {
    expect(() => Usuario.registrarPublico({ ...base, nombre: '  ' })).toThrow(
      'El nombre es obligatorio',
    );
    expect(() =>
      Usuario.registrarPublico({ ...base, nombre: 'x'.repeat(121) }),
    ).toThrow(ValidationError);
  });

  it('cambia de rol', () => {
    const u = Usuario.registrarPublico(base);
    u.cambiarRol(Rol.PERSONAL);
    expect(u.rol).toBe(Rol.PERSONAL);
  });

  it('un usuario anonimizado o sin contraseña no puede iniciar sesión', () => {
    const u = Usuario.registrarPublico(base);
    const anon = Usuario.reconstruir({
      id: u.id,
      nombre: u.nombre,
      email: u.email,
      passwordHash: null,
      rol: u.rol,
      consentimientoPrivacidadEn: u.consentimientoPrivacidadEn,
      versionAvisoPrivacidad: u.versionAvisoPrivacidad,
      anonimizadoEn: new Date(),
      creadoEn: u.creadoEn,
    });
    expect(anon.puedeIniciarSesion).toBe(false);
  });
});

describe('Email', () => {
  it('normaliza y valida', () => {
    expect(Email.crear(' A@B.co ').toString()).toBe('a@b.co');
    expect(() => Email.crear('sin-arroba')).toThrow(ValidationError);
    expect(() => Email.crear(undefined as unknown as string)).toThrow(
      ValidationError,
    );
  });
});

describe('Política de contraseñas', () => {
  it('exige longitud, letra y número', () => {
    expect(() => validarPassword('corta1')).toThrow(ValidationError);
    expect(() => validarPassword('solo-letras')).toThrow(ValidationError);
    expect(() => validarPassword('12345678')).toThrow(ValidationError);
    expect(() => validarPassword('x1'.repeat(40))).toThrow(ValidationError);
    expect(() => validarPassword('clave-segura-1')).not.toThrow();
  });
});

describe('Rol y RefreshToken', () => {
  it('reconoce los tres roles', () => {
    expect(esRol('PERSONAL')).toBe(true);
    expect(esRol('ROOT')).toBe(false);
  });

  it('un refresh token vence o se revoca', () => {
    const ahora = new Date('2026-11-07T10:00:00Z');
    const t = {
      id: 't',
      usuarioId: 'u',
      tokenHash: 'h',
      expiraEn: new Date('2026-11-08T10:00:00Z'),
      revocadoEn: null,
    };
    expect(refreshTokenVigente(t, ahora)).toBe(true);
    expect(refreshTokenVigente({ ...t, revocadoEn: ahora }, ahora)).toBe(false);
    expect(refreshTokenVigente(t, new Date('2026-11-09T00:00:00Z'))).toBe(
      false,
    );
  });
});
