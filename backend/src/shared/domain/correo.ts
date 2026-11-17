/**
 * Puerto para enviar correos (HU-29; lo reutiliza HU-30). La aplicación no sabe si detrás
 * hay un servidor SMTP o solo un registro en los logs: eso lo decide la infraestructura.
 */
export interface MensajeCorreo {
  para: string;
  asunto: string;
  /** Texto plano: se lee bien en cualquier cliente de correo y con lectores de pantalla. */
  texto: string;
}

export interface ServicioCorreo {
  /** Lanza un error si el correo no se pudo entregar al servidor. */
  enviar(mensaje: MensajeCorreo): Promise<void>;
}

export const SERVICIO_CORREO = Symbol('SERVICIO_CORREO');
