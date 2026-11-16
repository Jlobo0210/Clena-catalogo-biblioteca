import { createTransport, type Transporter } from 'nodemailer';
import { MensajeCorreo, ServicioCorreo } from '../../domain/correo';
import { ConfiguracionSmtp } from './configuracion-correo';

/** Adaptador SMTP del puerto de correo (HU-29), con nodemailer. */
export class SmtpCorreo implements ServicioCorreo {
  private readonly transporte: Transporter;

  constructor(private readonly config: ConfiguracionSmtp) {
    this.transporte = createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      ...(config.usuario
        ? { auth: { user: config.usuario, pass: config.clave } }
        : {}),
    });
  }

  async enviar(mensaje: MensajeCorreo): Promise<void> {
    await this.transporte.sendMail({
      from: this.config.remitente,
      to: mensaje.para,
      subject: mensaje.asunto,
      text: mensaje.texto,
    });
  }
}
