import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConflictError } from '../../../../shared/domain/domain-error';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { Prestamo } from '../../domain/entities/prestamo';
import {
  ConteoPendientes,
  EjemplarParaPrestamo,
  FiltroPrestamos,
  PrestamoDetalle,
  PrestamoRepository,
  UsuarioParaPrestamo,
} from '../../domain/repositories/prestamo.repository';

/** La columna fecha_limite es DATE: se guarda y se lee como «YYYY-MM-DD». */
const aFechaDb = (fecha: string) => new Date(`${fecha}T00:00:00Z`);
const deFechaDb = (fecha: Date) => fecha.toISOString().slice(0, 10);

const INCLUIR_DETALLE = {
  ejemplar: {
    select: {
      id: true,
      codigoInventario: true,
      libro: { select: { id: true, titulo: true } },
    },
  },
  usuario: { select: { id: true, nombre: true, email: true } },
  registradoPor: { select: { id: true, nombre: true } },
} satisfies Prisma.PrestamoInclude;

type FilaDetalle = Prisma.PrestamoGetPayload<{
  include: typeof INCLUIR_DETALLE;
}>;

function aDetalle(f: FilaDetalle): PrestamoDetalle {
  return {
    id: f.id,
    ejemplar: {
      id: f.ejemplar.id,
      codigoInventario: f.ejemplar.codigoInventario,
    },
    libro: f.ejemplar.libro,
    usuario: f.usuario,
    registradoPor: f.registradoPor,
    fechaPrestamo: f.fechaPrestamo,
    fechaLimite: deFechaDb(f.fechaLimite),
    fechaDevolucion: f.fechaDevolucion,
  };
}

@Injectable()
export class PrismaPrestamoRepository implements PrestamoRepository {
  constructor(private readonly prisma: PrismaService) {}

  async buscarEjemplar(
    ref: { id: string } | { codigoInventario: string },
  ): Promise<EjemplarParaPrestamo | null> {
    const fila = await this.prisma.ejemplar.findUnique({
      where: ref,
      select: {
        id: true,
        codigoInventario: true,
        estado: true,
        libro: { select: { titulo: true } },
      },
    });
    return fila
      ? {
          id: fila.id,
          codigoInventario: fila.codigoInventario,
          estado: fila.estado,
          libroTitulo: fila.libro.titulo,
        }
      : null;
  }

  buscarUsuario(
    ref: { id: string } | { email: string },
  ): Promise<UsuarioParaPrestamo | null> {
    return this.prisma.usuario.findUnique({
      where: ref,
      select: { id: true, nombre: true, email: true },
    });
  }

  contarSinDevolverDeUsuario(usuarioId: string): Promise<number> {
    return this.prisma.prestamo.count({
      where: { usuarioId, fechaDevolucion: null },
    });
  }

  async registrar(p: Prestamo): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      // Cambio condicional: si dos personas prestan el mismo ejemplar a la vez, solo una gana.
      const { count } = await tx.ejemplar.updateMany({
        where: { id: p.ejemplarId, estado: 'DISPONIBLE' },
        data: { estado: 'PRESTADO' },
      });
      if (count === 0) {
        throw new ConflictError(
          'El ejemplar ya no está disponible para préstamo',
        );
      }
      await tx.prestamo.create({
        data: {
          id: p.id,
          ejemplarId: p.ejemplarId,
          usuarioId: p.usuarioId,
          registradoPorId: p.registradoPorId,
          fechaPrestamo: p.fechaPrestamo,
          fechaLimite: aFechaDb(p.fechaLimite),
        },
      });
    });
  }

  async buscarPorId(id: string): Promise<Prestamo | null> {
    const f = await this.prisma.prestamo.findUnique({ where: { id } });
    return f
      ? Prestamo.reconstruir({
          id: f.id,
          ejemplarId: f.ejemplarId,
          usuarioId: f.usuarioId,
          registradoPorId: f.registradoPorId,
          fechaPrestamo: f.fechaPrestamo,
          fechaLimite: deFechaDb(f.fechaLimite),
          fechaDevolucion: f.fechaDevolucion,
        })
      : null;
  }

  async registrarDevolucion(p: Prestamo): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.prestamo.updateMany({
        where: { id: p.id, fechaDevolucion: null },
        data: { fechaDevolucion: p.fechaDevolucion },
      });
      if (count === 0) {
        throw new ConflictError('Este préstamo ya fue devuelto');
      }
      await tx.ejemplar.updateMany({
        where: { id: p.ejemplarId, estado: 'PRESTADO' },
        data: { estado: 'DISPONIBLE' },
      });
    });
  }

  async buscarDetalle(id: string): Promise<PrestamoDetalle | null> {
    const f = await this.prisma.prestamo.findUnique({
      where: { id },
      include: INCLUIR_DETALLE,
    });
    return f ? aDetalle(f) : null;
  }

  async listar(
    f: FiltroPrestamos,
  ): Promise<{ items: PrestamoDetalle[]; total: number }> {
    const porEstado: Record<
      NonNullable<FiltroPrestamos['estado']>,
      Prisma.PrestamoWhereInput
    > = {
      SIN_DEVOLVER: { fechaDevolucion: null },
      VENCIDO: { fechaDevolucion: null },
      DEVUELTO: { fechaDevolucion: { not: null } },
    };
    // Las condiciones sobre la fecha límite se combinan en un solo filtro.
    const fechaLimite: Prisma.DateTimeFilter = {
      ...(f.estado === 'VENCIDO' ? { lt: aFechaDb(f.hoy) } : {}),
      ...(f.limiteDesde ? { gte: aFechaDb(f.limiteDesde) } : {}),
      ...(f.limiteHasta ? { lte: aFechaDb(f.limiteHasta) } : {}),
    };
    const where: Prisma.PrestamoWhereInput = {
      ...(f.estado ? porEstado[f.estado] : {}),
      ...(Object.keys(fechaLimite).length > 0 ? { fechaLimite } : {}),
      ...(f.usuarioId ? { usuarioId: f.usuarioId } : {}),
      ...(f.ejemplarId ? { ejemplarId: f.ejemplarId } : {}),
    };

    const [filas, total] = await this.prisma.$transaction([
      this.prisma.prestamo.findMany({
        where,
        include: INCLUIR_DETALLE,
        // El id desempata para que la paginación sea estable.
        orderBy: [{ [f.ordenarPor]: f.direccion }, { id: 'asc' }],
        skip: (f.pagina - 1) * f.tamano,
        take: f.tamano,
      }),
      this.prisma.prestamo.count({ where }),
    ]);
    return { items: filas.map(aDetalle), total };
  }

  async contarPendientes(
    hoy: string,
    avisoHasta: string,
  ): Promise<ConteoPendientes> {
    const sinDevolver = { fechaDevolucion: null };
    const [total, vencidos, porVencer] = await this.prisma.$transaction([
      this.prisma.prestamo.count({ where: sinDevolver }),
      this.prisma.prestamo.count({
        where: { ...sinDevolver, fechaLimite: { lt: aFechaDb(hoy) } },
      }),
      this.prisma.prestamo.count({
        where: {
          ...sinDevolver,
          fechaLimite: { gte: aFechaDb(hoy), lte: aFechaDb(avisoHasta) },
        },
      }),
    ]);
    return { sinDevolver: total, vencidos, porVencer };
  }
}
