import { randomUUID } from 'node:crypto';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LoggerModule as PinoLoggerModule } from 'nestjs-pino';

/**
 * Logs estructurados en JSON con Pino. Cada petición lleva un id (x-request-id)
 * que también aparece en las respuestas de error para poder rastrearla.
 */
@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        pinoHttp: {
          level:
            config.get<string>('LOG_LEVEL') ||
            (config.get<string>('NODE_ENV') === 'test' ? 'silent' : 'info'),
          genReqId: (req, res) => {
            const header = req.headers['x-request-id'];
            const id = typeof header === 'string' ? header : randomUUID();
            res.setHeader('x-request-id', id);
            return id;
          },
          // Nunca escribir tokens ni contraseñas en los logs.
          redact: {
            paths: [
              'req.headers.authorization',
              'req.headers.cookie',
              'res.headers["set-cookie"]',
            ],
            censor: '[REDACTED]',
          },
          autoLogging: {
            ignore: (req) => req.url === '/health',
          },
        },
      }),
    }),
  ],
})
export class LoggerModule {}
