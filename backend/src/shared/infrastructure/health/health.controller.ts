import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { DatabaseHealthIndicator } from './database.health';

/**
 * GET /health (fuera de /api/v1, para Docker y el despliegue).
 * Vive en infraestructura porque es operación, no negocio: revisa la conexión con PostgreSQL.
 */
@ApiTags('salud')
@Controller('health')
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
