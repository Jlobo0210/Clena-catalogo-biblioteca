import { Autor as AutorPrisma } from '@prisma/client';
import { Autor } from '../../domain/entities/autor';

/** Traduce entre el modelo de Prisma y la entidad de dominio. El modelo de Prisma no sale de aquí. */
export const AutorMapper = {
  toDomain(row: AutorPrisma): Autor {
    return Autor.reconstruir({
      id: row.id,
      nombre: row.nombre,
      creadoEn: row.creadoEn,
      actualizadoEn: row.actualizadoEn,
    });
  },

  toPersistence(
    autor: Autor,
  ): Pick<AutorPrisma, 'id' | 'nombre' | 'creadoEn' | 'actualizadoEn'> {
    return {
      id: autor.id,
      nombre: autor.nombre,
      creadoEn: autor.creadoEn,
      actualizadoEn: autor.actualizadoEn,
    };
  },
};
