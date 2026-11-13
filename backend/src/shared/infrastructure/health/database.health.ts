import { Injectable } from '@nestjs/common';
import { HealthIndicatorService } from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

/** Revisa que PostgreSQL responda a un SELECT 1 en menos de `timeoutMs`. */
@Injectable()
export class DatabaseHealthIndicator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly indicator: HealthIndicatorService,
  ) {}

  async isHealthy(key = 'database', timeoutMs = 1500) {
    const check = this.indicator.check(key);
    let timer: NodeJS.Timeout | undefined;
    try {
      const timeout = new Promise<never>((_, reject) => {
        timer = setTimeout(
          () => reject(new Error(`sin respuesta en ${timeoutMs} ms`)),
          timeoutMs,
        );
      });
      await Promise.race([this.prisma.$queryRaw`SELECT 1`, timeout]);
      return check.up();
    } catch (error) {
      return check.down({
        message: DatabaseHealthIndicator.resumen(error),
      });
    } finally {
      clearTimeout(timer);
    }
  }

  /** Primera línea útil del error, sin cadenas de conexión ni trazas. */
  private static resumen(error: unknown): string {
    const texto = error instanceof Error ? error.message : String(error);
    const linea = texto
      .split('\n')
      .map((l) => l.trim())
      .find(
        (l) => l.length > 0 && !l.startsWith('Invalid') && !l.includes('://'),
      );
    return linea ?? 'La base de datos no responde';
  }
}
