import { Prisma } from '@prisma/client';
import { Lugar } from '../../domain/entities/ubicacion';
import { aSlug } from '../mappers/tema.mapper';

const CODIGO_UBICACION_MAX = 30;

/**
 * Código corto e imprimible para una ubicación nueva: «SALA-1-HUMANIDADES-E-01».
 * Si ya está en uso, agrega -2, -3… Lo usan el panel (HU-25) y la importación CSV (HU-19).
 */
export async function codigoUbicacionLibre(
  cliente: Prisma.TransactionClient,
  lugar: Lugar,
): Promise<string> {
  const base = [lugar.sala, lugar.seccion, lugar.estante]
    .map((parte) => aSlug(parte).toUpperCase())
    .join('-')
    .slice(0, CODIGO_UBICACION_MAX);
  let codigo = base;
  for (
    let n = 2;
    await cliente.ubicacion.findUnique({ where: { codigo } });
    n++
  ) {
    const sufijo = `-${n}`;
    codigo = base.slice(0, CODIGO_UBICACION_MAX - sufijo.length) + sufijo;
  }
  return codigo;
}
