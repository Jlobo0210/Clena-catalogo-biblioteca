import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { SuscripcionDisponibilidad } from '../../domain/suscripcion-disponibilidad.entity';
import { SuscripcionDisponibilidadRepository } from '../../domain/suscripcion-disponibilidad.repository';

function toDomain(row: {
  id: string;
  usuarioId: string;
  libroId: string;
  notificadaEn: Date | null;
  canceladaEn: Date | null;
  creadoEn: Date;
}): SuscripcionDisponibilidad {
  return new SuscripcionDisponibilidad(
    row.id,
    row.usuarioId,
    row.libroId,
    row.notificadaEn,
    row.canceladaEn,
    row.creadoEn,
  );
}

@Injectable()
export class PrismaSuscripcionRepository
  implements SuscripcionDisponibilidadRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async buscarActiva(
    usuarioId: string,
    libroId: string,
  ): Promise<SuscripcionDisponibilidad | null> {
    const row = await this.prisma.suscripcionDisponibilidad.findFirst({
      where: {
        usuarioId,
        libroId,
        notificadaEn: null,
        canceladaEn: null,
      },
    });
    return row ? toDomain(row) : null;
  }

  async buscarActivasPorLibro(
    libroId: string,
  ): Promise<SuscripcionDisponibilidad[]> {
    const rows = await this.prisma.suscripcionDisponibilidad.findMany({
      where: { libroId, notificadaEn: null, canceladaEn: null },
    });
    return rows.map(toDomain);
  }

  async buscarPorId(id: string): Promise<SuscripcionDisponibilidad | null> {
    const row = await this.prisma.suscripcionDisponibilidad.findUnique({
      where: { id },
    });
    return row ? toDomain(row) : null;
  }

  async guardar(suscripcion: SuscripcionDisponibilidad): Promise<void> {
    await this.prisma.suscripcionDisponibilidad.create({
      data: {
        id: suscripcion.id,
        usuarioId: suscripcion.usuarioId,
        libroId: suscripcion.libroId,
        notificadaEn: suscripcion.notificadaEn,
        canceladaEn: suscripcion.canceladaEn,
        creadoEn: suscripcion.creadoEn,
      },
    });
  }

  async actualizar(suscripcion: SuscripcionDisponibilidad): Promise<void> {
    await this.prisma.suscripcionDisponibilidad.update({
      where: { id: suscripcion.id },
      data: {
        notificadaEn: suscripcion.notificadaEn,
        canceladaEn: suscripcion.canceladaEn,
      },
    });
  }
}
