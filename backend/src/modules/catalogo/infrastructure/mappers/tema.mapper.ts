import { Tema as TemaPrisma } from '@prisma/client';
import { Tema } from '../../domain/entities/tema';

/** Traduce entre el modelo de Prisma y la entidad de dominio. El modelo de Prisma no sale de aquí. */
export const TemaMapper = {
  toDomain(row: TemaPrisma): Tema {
    return Tema.reconstruir({
      id: row.id,
      nombre: row.nombre,
      creadoEn: row.creadoEn,
    });
  },

  toPersistence(tema: Tema): TemaPrisma {
    return {
      id: tema.id,
      nombre: tema.nombre,
      creadoEn: tema.creadoEn,
    };
  },
};
