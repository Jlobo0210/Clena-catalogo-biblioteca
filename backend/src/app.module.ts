import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './modules/auth/auth.module';
import { CatalogoModule } from './modules/catalogo/catalogo.module';
import { PrestamosModule } from './modules/prestamos/prestamos.module';
import { HealthModule } from './shared/infrastructure/health/health.module';
import { LoggerModule } from './shared/infrastructure/logger/logger.module';
import { PrismaModule } from './shared/infrastructure/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    LoggerModule,
    PrismaModule,
    HealthModule,
    AuthModule,
    CatalogoModule,
    PrestamosModule,
  ],
})
export class AppModule {}
