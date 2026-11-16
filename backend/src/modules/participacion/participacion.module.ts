import { Module } from '@nestjs/common';
import { RegistrarSolicitudUseCase } from './application/registrar-solicitud.use-case';
import {
  SOLICITUD_REPOSITORY,
  type SolicitudRepository,
} from './domain/solicitud';
import { PrismaSolicitudRepository } from './infrastructure/prisma-solicitud.repository';
import { SolicitudesController } from './presentation/solicitudes.controller';

@Module({
  controllers: [SolicitudesController],
  providers: [
    { provide: SOLICITUD_REPOSITORY, useClass: PrismaSolicitudRepository },
    {
      provide: RegistrarSolicitudUseCase,
      useFactory: (repositorio: SolicitudRepository) =>
        new RegistrarSolicitudUseCase(repositorio),
      inject: [SOLICITUD_REPOSITORY],
    },
  ],
})
export class ParticipacionModule {}
