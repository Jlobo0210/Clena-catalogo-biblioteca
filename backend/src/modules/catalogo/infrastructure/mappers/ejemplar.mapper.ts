import { Prisma } from '@prisma/client';
import { Ejemplar } from '../../domain/entities/ejemplar';
import { EstadoEjemplar } from '../../domain/value-objects/estado-ejemplar';

export const EJEMPLAR_INCLUDE = {
  ubicacion: true,
} satisfies Prisma.EjemplarInclude;

export type EjemplarConRelaciones = Prisma.EjemplarGetPayload<{
  include: typeof EJEMPLAR_INCLUDE;
}>;

export const EjemplarMapper = {
  toDomain(row: EjemplarConRelaciones): Ejemplar {
    return Ejemplar.reconstruir({
      id: row.id,
      libroId: row.libroId,
      ubicacion: {
        id: row.ubicacion.id,
        sala: row.ubicacion.sala,
        seccion: row.ubicacion.seccion,
        estante: row.ubicacion.estante,
        codigo: row.ubicacion.codigo,
      },
      codigoInventario: row.codigoInventario,
      estado: row.estado as EstadoEjemplar,
      observaciones: row.observaciones,
      creadoEn: row.creadoEn,
      actualizadoEn: row.actualizadoEn,
    });
  },

  toPersistence(e: Ejemplar): Prisma.EjemplarUncheckedCreateInput {
    return {
      id: e.id,
      libroId: e.libroId,
      ubicacionId: e.ubicacion.id,
      codigoInventario: e.codigoInventario,
      estado: e.estado,
      observaciones: e.observaciones,
      creadoEn: e.creadoEn,
      actualizadoEn: e.actualizadoEn,
    };
  },
};
