import {
  INestApplication,
  RequestMethod,
  ValidationPipe,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AllExceptionsFilter } from './shared/presentation/filters/all-exceptions.filter';
import { ErrorResponse } from './shared/presentation/http/error-response';

export const API_PREFIX = 'api/v1';
export const DOCS_PATH = 'docs';

/**
 * Configuración transversal de la API. La usan main.ts y las pruebas e2e,
 * así lo que se prueba es exactamente lo que se despliega.
 */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix(API_PREFIX, {
    exclude: [{ path: 'health', method: RequestMethod.GET }],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // quita propiedades que no estén en el DTO
      forbidNonWhitelisted: true, // y responde 400 si llegan
      transform: true, // convierte query/params a los tipos del DTO
    }),
  );
  app.useGlobalFilters(new AllExceptionsFilter());

  const origins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim());
  app.enableCors({ origin: origins });
  app.enableShutdownHooks();

  const config = new DocumentBuilder()
    .setTitle('CLENA · Catálogo bibliográfico accesible')
    .setDescription(
      'API de la Biblioteca del CLENA. Todos los errores usan el esquema ErrorResponse.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    extraModels: [ErrorResponse],
  });
  SwaggerModule.setup(DOCS_PATH, app, document);
}
