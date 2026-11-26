import {
  configuracionSmtpDesdeEntorno,
  enmascararCorreo,
} from './configuracion-correo';

const leerDe = (entorno: Record<string, string>) => (clave: string) =>
  entorno[clave];

describe('Configuración del correo (HU-29)', () => {
  it('sin SMTP_HOST no hay SMTP: los correos solo van al log', () => {
    expect(configuracionSmtpDesdeEntorno(leerDe({}))).toBeNull();
    expect(
      configuracionSmtpDesdeEntorno(leerDe({ SMTP_HOST: '  ' })),
    ).toBeNull();
  });

  it('con SMTP_HOST exige el remitente', () => {
    expect(() =>
      configuracionSmtpDesdeEntorno(leerDe({ SMTP_HOST: 'smtp.ejemplo.org' })),
    ).toThrow('Falta CORREO_REMITENTE');
  });

  it('usa el puerto 587 con STARTTLS por defecto y sin usuario no autentica', () => {
    expect(
      configuracionSmtpDesdeEntorno(
        leerDe({
          SMTP_HOST: 'smtp.ejemplo.org',
          CORREO_REMITENTE: 'Biblioteca <b@ejemplo.org>',
        }),
      ),
    ).toEqual({
      host: 'smtp.ejemplo.org',
      port: 587,
      secure: false,
      remitente: 'Biblioteca <b@ejemplo.org>',
    });
  });

  it('el puerto 465 usa TLS directo, salvo que SMTP_SECURE diga otra cosa', () => {
    const base = {
      SMTP_HOST: 'smtp.ejemplo.org',
      CORREO_REMITENTE: 'b@ejemplo.org',
      SMTP_PORT: '465',
      SMTP_USER: 'biblioteca',
      SMTP_PASS: 'clave',
    };
    expect(configuracionSmtpDesdeEntorno(leerDe(base))).toMatchObject({
      port: 465,
      secure: true,
      usuario: 'biblioteca',
      clave: 'clave',
    });
    expect(
      configuracionSmtpDesdeEntorno(leerDe({ ...base, SMTP_SECURE: 'false' })),
    ).toMatchObject({ secure: false });
  });

  it('rechaza un puerto inválido', () => {
    expect(() =>
      configuracionSmtpDesdeEntorno(
        leerDe({
          SMTP_HOST: 'smtp.ejemplo.org',
          CORREO_REMITENTE: 'b@ejemplo.org',
          SMTP_PORT: 'abc',
        }),
      ),
    ).toThrow('SMTP_PORT no es un puerto válido');
  });

  it('enmascara los correos para el log', () => {
    expect(enmascararCorreo('publico@clena.example')).toBe(
      'pu***@clena.example',
    );
    expect(enmascararCorreo('sin-arroba')).toBe('***');
  });
});
