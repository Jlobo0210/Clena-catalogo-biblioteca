import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  AlertaPrestamoRepository,
  PrestamoParaAlerta,
  RangoFechaLimite,
  TipoAlerta,
} from '../../domain/repositories/alerta-prestamo.repository';

/** La columna fecha_limite es DATE: se guarda y se lee como «YYYY-MM-DD». */
const aFechaDb = (fecha: string) => new Date(`${fecha}T00:00:00Z`);
const deFechaDb = (fecha: Date) => fecha.toISOString().slice(0, 10);

/** HU-29: bitácora de alertas (tabla alerta_prestamo, única por préstamo y tipo). */
@Injectable()
export class PrismaAlertaPrestamoRepository implements AlertaPrestamoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async pendientes(
    tipo: TipoAlerta,
    rango: RangoFechaLimite,
  ): Promise<PrestamoParaAlerta[]> {
    const filas = await this.prisma.prestamo.findMany({
      // Usa el índice parcial prestamo_activo_fecha_limite_idx (fecha_devolucion IS NULL).
      where: {
        fechaDevolucion: null,
        fechaLimite: {
          ...(rango.desde ? { gte: aFechaDb(rango.desde) } : {}),
          ...(rango.hasta ? { lte: aFechaDb(rango.hasta) } : {}),
        },
        alertas: { none: { tipo } },
        usuario: { anonimizadoEn: null },
      },
      select: {
        id: true,
        fechaLimite: true,
        usuario: { select: { nombre: true, email: true } },
        ejemplar: {
          select: {
            codigoInventario: true,
            libro: { select: { titulo: true } },
          },
        },
      },
      orderBy: [{ fechaLimite: 'asc' }, { id: 'asc' }],
    });
    return filas.map((f) => ({
      prestamoId: f.id,
      fechaLimite: deFechaDb(f.fechaLimite),
      usuario: f.usuario,
      libroTitulo: f.ejemplar.libro.titulo,
      codigoInventario: f.ejemplar.codigoInventario,
    }));
  }

  async reservar(
    prestamoId: string,
    tipo: TipoAlerta,
    enviadaEn: Date,
  ): Promise<boolean> {
    try {
      await this.prisma.alertaPrestamo.create({
        data: { prestamoId, tipo, enviadaEn },
      });
      return true;
    } catch (error) {
      // P2002: ya existe la alerta (prestamo_id, tipo); otra ejecución la tomó primero.
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        return false;
      }
      throw error;
    }
  }

  async liberar(prestamoId: string, tipo: TipoAlerta): Promise<void> {
    await this.prisma.alertaPrestamo.deleteMany({
      where: { prestamoId, tipo },
    });
  }
}
