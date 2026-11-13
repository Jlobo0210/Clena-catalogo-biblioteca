import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.health';

/** Rutas de salud: /health para Docker y el despliegue, y /api/v1/health como pide el enunciado. */
export const RUTAS_SALUD = ['health', 'api/v1/health'];

/**
 * GET /health y GET /api/v1/health (las dos responden lo mismo).
 * Vive en infraestructura porque es operación, no negocio: revisa la conexión con PostgreSQL.
 */
@ApiTags('salud')
@Controller(RUTAS_SALUD)
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly database: DatabaseHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'Estado de la API y de la base de datos' })
  check() {
    return this.health.check([() => this.database.isHealthy()]);
  }
}
