import { Module } from '@nestjs/common';
import { SERVICIO_CORREO, ServicioCorreo } from '../../shared/domain/correo';
import { CancelarSuscripcionUseCase } from './application/use-cases/cancelar-suscripcion.use-case';
import { NotificarSuscriptoresUseCase } from './application/use-cases/notificar-suscriptores.use-case';
import { SuscribirseUseCase } from './application/use-cases/suscribirse.use-case';
import {
  SUSCRIPCION_DISPONIBILIDAD_REPOSITORY,
  SuscripcionDisponibilidadRepository,
} from './domain/suscripcion-disponibilidad.repository';
import { PrismaSuscripcionRepository } from './infrastructure/persistence/prisma-suscripcion.repository';
import { SuscripcionesController } from './presentation/controllers/suscripciones.controller';

/**
 * HU-30: alertas de disponibilidad de libros.
 * Exporta NotificarSuscriptoresUseCase para que PrestamosModule lo use
 * al registrar devoluciones.
 */
@Module({
  controllers: [SuscripcionesController],
  providers: [
    {
      provide: SUSCRIPCION_DISPONIBILIDAD_REPOSITORY,
      useClass: PrismaSuscripcionRepository,
    },
    {
      provide: SuscribirseUseCase,
      useFactory: (repo: SuscripcionDisponibilidadRepository) =>
        new SuscribirseUseCase(repo),
      inject: [SUSCRIPCION_DISPONIBILIDAD_REPOSITORY],
    },
    {
      provide: CancelarSuscripcionUseCase,
      useFactory: (repo: SuscripcionDisponibilidadRepository) =>
        new CancelarSuscripcionUseCase(repo),
      inject: [SUSCRIPCION_DISPONIBILIDAD_REPOSITORY],
    },
    {
      provide: NotificarSuscriptoresUseCase,
      useFactory: (
        repo: SuscripcionDisponibilidadRepository,
        correo: ServicioCorreo,
      ) => new NotificarSuscriptoresUseCase(repo, correo),
      inject: [SUSCRIPCION_DISPONIBILIDAD_REPOSITORY, SERVICIO_CORREO],
    },
  ],
  exports: [NotificarSuscriptoresUseCase],
})
export class SuscripcionesModule {}
