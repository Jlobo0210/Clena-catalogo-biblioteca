/** Datos de conexión SMTP leídos de las variables de entorno (HU-29). */
export interface ConfiguracionSmtp {
  host: string;
  port: number;
  /** true = TLS desde el inicio (puerto 465); false = STARTTLS si el servidor lo ofrece (587). */
  secure: boolean;
  usuario?: string;
  clave?: string;
  remitente: string;
}

/**
 * Lee SMTP_HOST, SMTP_PORT, SMTP_SECURE, SMTP_USER, SMTP_PASS y CORREO_REMITENTE.
 * Sin SMTP_HOST devuelve null: los correos solo se registran en los logs (desarrollo y pruebas).
 * Con SMTP_HOST pero sin remitente, o con un puerto inválido, lanza un error claro al arrancar.
 */
export function configuracionSmtpDesdeEntorno(
  leer: (clave: string) => string | undefined,
): ConfiguracionSmtp | null {
  const valor = (clave: string) => leer(clave)?.trim() || undefined;
  const host = valor('SMTP_HOST');
  if (!host) return null;

  const remitente = valor('CORREO_REMITENTE');
  if (!remitente) {
    throw new Error(
      'Falta CORREO_REMITENTE: es obligatorio cuando se configura SMTP_HOST (p. ej. "Biblioteca CLENA <biblioteca@ejemplo.org>").',
    );
  }

  const textoPuerto = valor('SMTP_PORT');
  const port = textoPuerto === undefined ? 587 : Number(textoPuerto);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`SMTP_PORT no es un puerto válido: «${textoPuerto}».`);
  }

  const secure = valor('SMTP_SECURE')
    ? valor('SMTP_SECURE') === 'true'
    : port === 465;
  const usuario = valor('SMTP_USER');
  return {
    host,
    port,
    secure,
    remitente,
    ...(usuario ? { usuario, clave: leer('SMTP_PASS') ?? '' } : {}),
  };
}

/** «publico@clena.example» → «pu***@clena.example»: los logs no guardan correos completos. */
export function enmascararCorreo(email: string): string {
  const [local, dominio] = email.split('@');
  if (!dominio) return '***';
  return `${local.slice(0, 2)}***@${dominio}`;
}
