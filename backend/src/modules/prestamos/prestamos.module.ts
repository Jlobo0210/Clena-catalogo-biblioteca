import { Module } from '@nestjs/common';
import { SuscripcionesModule } from '../suscripciones/suscripciones.module';
import { NotificarSuscriptoresUseCase } from '../suscripciones/application/use-cases/notificar-suscriptores.use-case';

import { ConfigService } from '@nestjs/config';
import { SERVICIO_CORREO, ServicioCorreo } from '../../shared/domain/correo';
import { ID_GENERATOR, IdGenerator } from '../../shared/domain/id-generator';
import { UuidIdGenerator } from '../../shared/infrastructure/uuid-id-generator';
import {
  POLITICA_PRESTAMOS,
  PoliticaPrestamos,
  politicaDesdeEntorno,
} from './application/politica-prestamos';
import {
  POLITICA_ALERTAS,
  PoliticaAlertas,
  politicaAlertasDesdeEntorno,
} from './application/politica-alertas';
import { EnviarAlertasPrestamoUseCase } from './application/use-cases/enviar-alertas-prestamo.use-case';
import { ListarMisPrestamosUseCase } from './application/use-cases/listar-mis-prestamos.use-case';
import { ListarPrestamosUseCase } from './application/use-cases/listar-prestamos.use-case';
import { ObtenerPrestamoUseCase } from './application/use-cases/obtener-prestamo.use-case';
import { RegistrarDevolucionUseCase } from './application/use-cases/registrar-devolucion.use-case';
import { RegistrarPrestamoUseCase } from './application/use-cases/registrar-prestamo.use-case';
import { ResumenPrestamosUseCase } from './application/use-cases/resumen-prestamos.use-case';
import {
  ALERTA_PRESTAMO_REPOSITORY,
  AlertaPrestamoRepository,
} from './domain/repositories/alerta-prestamo.repository';
import {
  PRESTAMO_REPOSITORY,
  PrestamoRepository,
} from './domain/repositories/prestamo.repository';
import { PrismaAlertaPrestamoRepository } from './infrastructure/persistence/prisma-alerta-prestamo.repository';
import { PrismaPrestamoRepository } from './infrastructure/persistence/prisma-prestamo.repository';
import { AlertasPrestamoTarea } from './infrastructure/tareas/alertas-prestamo.tarea';
import { PrestamosController } from './presentation/controllers/prestamos.controller';

/**
 * HU-26: préstamos y devoluciones. HU-29: alertas de devolución por correo (tarea programada).
 * Composición del módulo: aquí se une cada puerto
 * con su implementación; los casos de uso se construyen con useFactory.
 */
@Module({
  imports: [SuscripcionesModule],
  controllers: [PrestamosController],
  providers: [
    { provide: PRESTAMO_REPOSITORY, useClass: PrismaPrestamoRepository },
    {
      provide: ALERTA_PRESTAMO_REPOSITORY,
      useClass: PrismaAlertaPrestamoRepository,
    },
    { provide: ID_GENERATOR, useClass: UuidIdGenerator },
    {
      provide: POLITICA_PRESTAMOS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        politicaDesdeEntorno((clave) => config.get<string>(clave)),
    },
    {
      provide: RegistrarPrestamoUseCase,
      useFactory: (
        prestamos: PrestamoRepository,
        ids: IdGenerator,
        politica: PoliticaPrestamos,
      ) => new RegistrarPrestamoUseCase(prestamos, ids, politica),
      inject: [PRESTAMO_REPOSITORY, ID_GENERATOR, POLITICA_PRESTAMOS],
    },
    {
      provide: RegistrarDevolucionUseCase,
      useFactory: (
        prestamos: PrestamoRepository,
        notificar: NotificarSuscriptoresUseCase,
      ) => new RegistrarDevolucionUseCase(prestamos, notificar),
      inject: [PRESTAMO_REPOSITORY, NotificarSuscriptoresUseCase],
    },
    {
      provide: ListarPrestamosUseCase,
      useFactory: (prestamos: PrestamoRepository) =>
        new ListarPrestamosUseCase(prestamos),
      inject: [PRESTAMO_REPOSITORY],
    },
    {
      provide: ListarMisPrestamosUseCase,
      useFactory: (listar: ListarPrestamosUseCase) =>
        new ListarMisPrestamosUseCase(listar),
      inject: [ListarPrestamosUseCase],
    },
    {
      provide: ResumenPrestamosUseCase,
      useFactory: (prestamos: PrestamoRepository) =>
        new ResumenPrestamosUseCase(prestamos),
      inject: [PRESTAMO_REPOSITORY],
    },
    {
      provide: POLITICA_ALERTAS,
      inject: [ConfigService],
      useFactory: (config: ConfigService) =>
        politicaAlertasDesdeEntorno((clave) => config.get<string>(clave)),
    },
    {
      provide: EnviarAlertasPrestamoUseCase,
      useFactory: (
        alertas: AlertaPrestamoRepository,
        correo: ServicioCorreo,
        politica: PoliticaAlertas,
      ) => new EnviarAlertasPrestamoUseCase(alertas, correo, politica),
      inject: [ALERTA_PRESTAMO_REPOSITORY, SERVICIO_CORREO, POLITICA_ALERTAS],
    },
    AlertasPrestamoTarea,
    {
      provide: ObtenerPrestamoUseCase,
      useFactory: (prestamos: PrestamoRepository) =>
        new ObtenerPrestamoUseCase(prestamos),
      inject: [PRESTAMO_REPOSITORY],
    },
  ],
})
export class PrestamosModule {}
