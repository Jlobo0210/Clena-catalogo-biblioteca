import { Logger } from '@nestjs/common';
import { MensajeCorreo, ServicioCorreo } from '../../domain/correo';
import { enmascararCorreo } from './configuracion-correo';

/**
 * Adaptador sin servidor de correo: escribe en el log a quién iría y el asunto, sin el
 * cuerpo ni el correo completo. Se usa cuando no hay SMTP_HOST (desarrollo y pruebas).
 */
export class CorreoEnRegistro implements ServicioCorreo {
  private readonly logger = new Logger('Correo');

  enviar(mensaje: MensajeCorreo): Promise<void> {
    this.logger.log(
      `Sin SMTP configurado: no se envió «${mensaje.asunto}» a ${enmascararCorreo(mensaje.para)}`,
    );
    return Promise.resolve();
  }
}
