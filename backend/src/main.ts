import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';
import { API_PREFIX, DOCS_PATH, configureApp } from './app.setup';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const logger = app.get(Logger);
  app.useLogger(logger);

  configureApp(app);

  const port = Number(process.env.PORT || 3000);
  await app.listen(port);
  logger.log(
    `API en /${API_PREFIX}, Swagger en /${DOCS_PATH}, salud en /health y /${API_PREFIX}/health (puerto ${port})`,
    'Bootstrap',
  );
}
void bootstrap();
