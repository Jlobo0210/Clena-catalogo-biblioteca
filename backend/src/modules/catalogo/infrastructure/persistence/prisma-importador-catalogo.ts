import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ConflictError } from '../../../../shared/domain/domain-error';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  FilaCatalogo,
  ImportadorCatalogo,
  ResultadoFila,
} from '../../domain/repositories/importador-catalogo';
import { aSlug } from '../mappers/tema.mapper';

type Tx = Prisma.TransactionClient;

const CODIGO_UBICACION_MAX = 30;

/** Guarda cada fila del CSV en su propia transacción (HU-19). Reglas: ver ImportadorCatalogo. */
@Injectable()
export class PrismaImportadorCatalogo implements ImportadorCatalogo {
  constructor(private readonly prisma: PrismaService) {}

  importarFila(fila: FilaCatalogo): Promise<ResultadoFila> {
    return this.prisma.$transaction(async (tx) => {
      const autores = await obtenerAutores(tx, fila.autores);
      const temas = await obtenerTemas(tx, fila.temas);

      let libro = fila.libro.isbn
        ? await tx.libro.findUnique({ where: { isbn: fila.libro.isbn } })
        : await buscarPorTituloYAutores(tx, fila.libro.titulo, autores.ids);
      const libroExistia = libro !== null;
      if (!libro) {
        libro = await tx.libro.create({
          data: {
            ...fila.libro,
            autores: {
              create: autores.ids.map((autorId, i) => ({
                autorId,
                orden: i + 1,
              })),
            },
            temas: { create: temas.ids.map((temaId) => ({ temaId })) },
          },
        });
      }

      let ejemplar: ResultadoFila['ejemplar'] = null;
      let ubicacionCreada = false;
      if (fila.ejemplar) {
        if (libro.formato === 'DIGITAL') {
          throw new ConflictError(
            `«${libro.titulo}» ya está registrado como solo digital: no admite ejemplares`,
          );
        }
        const existente = await tx.ejemplar.findUnique({
          where: { codigoInventario: fila.ejemplar.codigoInventario },
        });
        if (existente && existente.libroId !== libro.id) {
          throw new ConflictError(
            `El código de inventario ${fila.ejemplar.codigoInventario} ya pertenece a otro libro`,
          );
        }
        if (existente) {
          ejemplar = 'existente';
        } else {
          const ubicacion = await obtenerUbicacion(tx, fila.ejemplar);
          ubicacionCreada = ubicacion.creada;
          await tx.ejemplar.create({
            data: {
              libroId: libro.id,
              ubicacionId: ubicacion.id,
              codigoInventario: fila.ejemplar.codigoInventario,
              estado: fila.ejemplar.estado,
            },
          });
          ejemplar = 'creado';
        }
      }

      return {
        libro: libroExistia ? 'existente' : 'creado',
        ejemplar,
        autoresCreados: autores.creados,
        temasCreados: temas.creados,
        ubicacionCreada,
      };
    });
  }
}

/** Busca cada autor por nombre (sin distinguir mayúsculas) y crea los que falten. */
async function obtenerAutores(
  tx: Tx,
  nombres: string[],
): Promise<{ ids: string[]; creados: number }> {
  const ids: string[] = [];
  let creados = 0;
  for (const nombre of nombres) {
    const existente = await tx.autor.findFirst({
      where: { nombre: { equals: nombre, mode: 'insensitive' } },
      select: { id: true },
    });
    if (existente) {
      ids.push(existente.id);
    } else {
      ids.push((await tx.autor.create({ data: { nombre } })).id);
      creados++;
    }
  }
  return { ids: [...new Set(ids)], creados };
}

/** Busca cada tema por nombre o por slug («Bases-de-datos» = «Bases de datos») y crea los que falten. */
async function obtenerTemas(
  tx: Tx,
  nombres: string[],
): Promise<{ ids: string[]; creados: number }> {
  const ids: string[] = [];
  let creados = 0;
  for (const nombre of nombres) {
    const slug = aSlug(nombre);
    const existente = await tx.tema.findFirst({
      where: {
        OR: [{ nombre: { equals: nombre, mode: 'insensitive' } }, { slug }],
      },
      select: { id: true },
    });
    if (existente) {
      ids.push(existente.id);
    } else {
      ids.push((await tx.tema.create({ data: { nombre, slug } })).id);
      creados++;
    }
  }
  return { ids: [...new Set(ids)], creados };
}

/** Sin ISBN, un libro es el mismo si coincide el título (sin distinguir mayúsculas) y tiene los mismos autores. */
async function buscarPorTituloYAutores(
  tx: Tx,
  titulo: string,
  autorIds: string[],
) {
  const candidatos = await tx.libro.findMany({
    where: { titulo: { equals: titulo, mode: 'insensitive' } },
    include: { autores: { select: { autorId: true } } },
  });
  const buscados = [...autorIds].sort().join();
  const igual = candidatos.find(
    (l) =>
      l.autores
        .map((a) => a.autorId)
        .sort()
        .join() === buscados,
  );
  return igual ?? null;
}

/** Busca la ubicación por sala, sección y estante; si no existe, la crea con un código imprimible. */
async function obtenerUbicacion(
  tx: Tx,
  u: { sala: string; seccion: string; estante: string },
): Promise<{ id: string; creada: boolean }> {
  const existente = await tx.ubicacion.findUnique({
    where: {
      sala_seccion_estante: {
        sala: u.sala,
        seccion: u.seccion,
        estante: u.estante,
      },
    },
    select: { id: true },
  });
  if (existente) return { id: existente.id, creada: false };

  const base = [u.sala, u.seccion, u.estante]
    .map((parte) => aSlug(parte).toUpperCase())
    .join('-')
    .slice(0, CODIGO_UBICACION_MAX);
  let codigo = base;
  for (let n = 2; await tx.ubicacion.findUnique({ where: { codigo } }); n++) {
    const sufijo = `-${n}`;
    codigo = base.slice(0, CODIGO_UBICACION_MAX - sufijo.length) + sufijo;
  }
  const creada = await tx.ubicacion.create({
    data: { sala: u.sala, seccion: u.seccion, estante: u.estante, codigo },
    select: { id: true },
  });
  return { id: creada.id, creada: true };
}
