import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  // Prefijo /api/v1, Swagger en /docs, /health, logs y filtro de errores: HU-09.
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
