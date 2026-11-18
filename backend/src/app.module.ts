import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogoModule } from './modules/catalogo/catalogo.module';
import { ConfiguracionModule } from './modules/configuracion/configuracion.module';
import { PrestamosModule } from './modules/prestamos/prestamos.module';
import { ParticipacionModule } from './modules/participacion/participacion.module';
import { CorreoModule } from './shared/infrastructure/correo/correo.module';
import { HealthModule } from './shared/infrastructure/health/health.module';
import { LoggerModule } from './shared/infrastructure/logger/logger.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // HU-29: tareas programadas (alertas de préstamo) y envío de correo.
    ScheduleModule.forRoot(),
    LoggerModule,
    PrismaModule,
    CorreoModule,
    HealthModule,
    AuthModule,
    CatalogoModule,
    ConfiguracionModule,
    PrestamosModule,
    ParticipacionModule,
  ],
})
export class AppModule {}
