import { Global, Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SERVICIO_CORREO, ServicioCorreo } from '../../domain/correo';
import { configuracionSmtpDesdeEntorno } from './configuracion-correo';
import { CorreoEnRegistro } from './correo-en-registro';
import { SmtpCorreo } from './smtp-correo';

/**
 * Elige el adaptador del puerto de correo (HU-29): SMTP si hay SMTP_HOST; si no, un registro
 * en los logs. Es global para que cualquier módulo (préstamos, HU-30) inyecte SERVICIO_CORREO.
 */
@Global()
@Module({
  providers: [
    {
      provide: SERVICIO_CORREO,
      inject: [ConfigService],
      useFactory: (config: ConfigService): ServicioCorreo => {
        const smtp = configuracionSmtpDesdeEntorno((clave) =>
          config.get<string>(clave),
        );
        const logger = new Logger('Correo');
        if (smtp) {
          logger.log(`Correos por SMTP en ${smtp.host}:${smtp.port}`);
          return new SmtpCorreo(smtp);
        }
        if (config.get<string>('NODE_ENV') === 'production') {
          logger.warn(
            'SMTP_HOST no está configurado: los correos de alerta no se enviarán, solo quedarán en el log.',
          );
        }
        return new CorreoEnRegistro();
      },
    },
  ],
  exports: [SERVICIO_CORREO],
})
export class CorreoModule {}
