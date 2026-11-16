import { Module } from '@nestjs/common';
import { ConfiguracionUseCases } from './application/use-cases/configuracion.use-cases';
import {
  CONFIGURACION_REPOSITORY,
  ConfiguracionRepository,
} from './domain/repositories/configuracion.repository';
import { PrismaConfiguracionRepository } from './infrastructure/persistence/prisma-configuracion.repository';
import { ConfiguracionController } from './presentation/controllers/configuracion.controller';

@Module({
  controllers: [ConfiguracionController],
  providers: [
    {
      provide: CONFIGURACION_REPOSITORY,
      useClass: PrismaConfiguracionRepository,
    },
    {
      provide: ConfiguracionUseCases,
      useFactory: (repositorio: ConfiguracionRepository) =>
        new ConfiguracionUseCases(repositorio),
      inject: [CONFIGURACION_REPOSITORY],
    },
  ],
})
export class ConfiguracionModule {}
