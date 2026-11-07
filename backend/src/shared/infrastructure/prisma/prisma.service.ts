import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

/**
 * Cliente de Prisma compartido. Solo se inyecta en repositorios de infraestructura.
 * La conexión es perezosa: Prisma se conecta en la primera consulta.
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
