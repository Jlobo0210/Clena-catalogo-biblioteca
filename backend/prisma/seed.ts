// Datos de demostración (HU-10). Son ficticios: no se usa ningún dato real del CLENA.
// Se puede ejecutar varias veces sin duplicar registros: npm run prisma:seed
import {
  EstadoEjemplar,
  Formato,
  PrismaClient,
  Rol,
  TipoMaterial,
} from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

const VERSION_AVISO = 'demo-1';
const TOTAL_LIBROS = 50;

const TEMAS = [
  'Arquitectura',
  'Bases de datos',
  'Redes',
  'Programación',
  'Literatura',
  'Historia',
  'Ciencias naturales',
  'Matemáticas',
];

const AUTORES = [
  'Lucía Ramírez Peñaloza',
  'Andrés Núñez Castaño',
  'María José Ibáñez',
  'Tomás Oviedo Gutiérrez',
  'Sofía Martínez Ardila',
  'Julián Beltrán Muñoz',
  'Camila Pérez Londoño',
  'Óscar Quintana Díaz',
];

const AREAS = [
  'Fundamentos de',
  'Introducción a',
  'Guía práctica de',
  'Historia de',
  'Manual de',
];

const IDIOMAS = ['es', 'es', 'es', 'en', 'fr'];
const TIPOS = [
  TipoMaterial.LIBRO,
  TipoMaterial.LIBRO,
  TipoMaterial.REVISTA,
  TipoMaterial.TESIS,
];

/** Convierte un nombre en un identificador para URL: «Bases de datos» → «bases-de-datos». */
function aSlug(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/** Genera un ISBN-13 con dígito de control válido a partir de un consecutivo de demostración. */
function isbnDemo(consecutivo: number): string {
  const base = `97800000${String(consecutivo).padStart(4, '0')}`;
  const suma = [...base].reduce(
    (total, digito, i) => total + Number(digito) * (i % 2 === 0 ? 1 : 3),
    0,
  );
  return `${base}${(10 - (suma % 10)) % 10}`;
}

function formatoDe(i: number): Formato {
  if (i % 10 === 0) return Formato.DIGITAL;
  if (i % 5 === 0) return Formato.FISICO_Y_DIGITAL;
  return Formato.FISICO;
}

function estadoDe(i: number): EstadoEjemplar {
  // PRESTADO no se usa: exigiría un préstamo activo que sea consistente con el ejemplar.
  if (i % 11 === 0) return EstadoEjemplar.EN_REPARACION;
  if (i % 17 === 0) return EstadoEjemplar.PERDIDO;
  return EstadoEjemplar.DISPONIBLE;
}

async function sembrarUsuarios(password: string): Promise<void> {
  const passwordHash = await hash(password, 10);
  const usuarios = [
    { nombre: 'Administración Demo', email: 'admin@clena.example', rol: Rol.ADMINISTRADOR },
    { nombre: 'Personal Demo', email: 'personal@clena.example', rol: Rol.PERSONAL },
    { nombre: 'Visitante Demo', email: 'publico@clena.example', rol: Rol.PUBLICO },
  ];
  for (const usuario of usuarios) {
    await prisma.usuario.upsert({
      where: { email: usuario.email },
      update: {},
      create: {
        ...usuario,
        passwordHash,
        consentimientoPrivacidadEn: new Date(),
        versionAvisoPrivacidad: VERSION_AVISO,
      },
    });
  }
}

async function sembrarTemas(): Promise<string[]> {
  const ids: string[] = [];
  for (const nombre of TEMAS) {
    const tema = await prisma.tema.upsert({
      where: { nombre },
      update: {},
      create: { nombre, slug: aSlug(nombre) },
    });
    ids.push(tema.id);
  }
  return ids;
}

/** Autor no tiene columna única, así que primero se busca por nombre. */
async function obtenerAutor(nombre: string): Promise<string> {
  const existente = await prisma.autor.findFirst({ where: { nombre } });
  const autor = existente ?? (await prisma.autor.create({ data: { nombre } }));
  return autor.id;
}

async function sembrarUbicaciones(): Promise<string[]> {
  const ids: string[] = [];
  for (let sala = 1; sala <= 2; sala++) {
    for (const seccion of ['Ingeniería', 'Humanidades']) {
      for (let estante = 1; estante <= 3; estante++) {
        const codigo = `S${sala}-${seccion.slice(0, 3).toUpperCase()}-E${estante}`;
        const ubicacion = await prisma.ubicacion.upsert({
          where: { codigo },
          update: {},
          create: {
            sala: `Sala ${sala}`,
            seccion,
            estante: `E-${String(estante).padStart(2, '0')}`,
            codigo,
          },
        });
        ids.push(ubicacion.id);
      }
    }
  }
  return ids;
}

async function sembrarLibro(datos: {
  isbn?: string;
  titulo: string;
  anioPublicacion: number;
  idioma: string;
  tipoMaterial: TipoMaterial;
  formato: Formato;
  autorIds: string[];
  temaIds: string[];
  ubicacionId: string;
  codigoBase: string;
  copias: number;
  estado: (copia: number) => EstadoEjemplar;
}): Promise<void> {
  // Si el libro ya existe (mismo título), no se vuelve a crear.
  if (await prisma.libro.findFirst({ where: { titulo: datos.titulo } })) return;

  const esDigital = datos.formato !== Formato.FISICO;
  const conEjemplares = datos.formato !== Formato.DIGITAL;

  await prisma.libro.create({
    data: {
      titulo: datos.titulo,
      anioPublicacion: datos.anioPublicacion,
      idioma: datos.idioma,
      isbn: datos.isbn,
      tipoMaterial: datos.tipoMaterial,
      formato: datos.formato,
      enlaceDigital: esDigital
        ? `https://biblioteca.example/digital/${aSlug(datos.titulo)}`
        : null,
      autores: {
        create: datos.autorIds.map((autorId, i) => ({ autorId, orden: i + 1 })),
      },
      temas: { create: datos.temaIds.map((temaId) => ({ temaId })) },
      ejemplares: conEjemplares
        ? {
            create: Array.from({ length: datos.copias }, (_, copia) => ({
              codigoInventario: `${datos.codigoBase}-${copia + 1}`,
              estado: datos.estado(copia),
              ubicacionId: datos.ubicacionId,
            })),
          }
        : undefined,
    },
  });
}

async function main(): Promise<void> {
  // En la imagen de Docker NODE_ENV es production; ahí solo se siembra si SEED_DEMO=true (docker-compose de la demo).
  if (process.env.NODE_ENV === 'production' && process.env.SEED_DEMO !== 'true') {
    throw new Error(
      'Las semillas son de demostración: en producción solo se ejecutan con SEED_DEMO=true.',
    );
  }
  const password = process.env.SEED_PASSWORD;
  if (!password) {
    throw new Error('Falta SEED_PASSWORD en .env (ver .env.example).');
  }

  await sembrarUsuarios(password);
  const temaIds = await sembrarTemas();
  const autorIds: string[] = [];
  for (const nombre of AUTORES) autorIds.push(await obtenerAutor(nombre));
  const ubicacionIds = await sembrarUbicaciones();

  // Caso de prueba de HU-21: «garcia marques» y «cien anos soledad» deben encontrar este libro.
  await sembrarLibro({
    titulo: 'Cien años de soledad',
    anioPublicacion: 1967,
    idioma: 'es',
    tipoMaterial: TipoMaterial.LIBRO,
    formato: Formato.FISICO,
    autorIds: [await obtenerAutor('Gabriel García Márquez')],
    temaIds: [temaIds[TEMAS.indexOf('Literatura')]],
    ubicacionId: ubicacionIds[0],
    codigoBase: 'INV-0000',
    copias: 2,
    estado: () => EstadoEjemplar.DISPONIBLE,
  });

  for (let i = 1; i < TOTAL_LIBROS; i++) {
    const tema = TEMAS[i % TEMAS.length];
    await sembrarLibro({
      isbn: i % 7 === 0 ? undefined : isbnDemo(i),
      titulo: `${AREAS[i % AREAS.length]} ${tema.toLowerCase()}, vol. ${i}`,
      anioPublicacion: 1980 + (i % 45),
      idioma: IDIOMAS[i % IDIOMAS.length],
      tipoMaterial: TIPOS[i % TIPOS.length],
      formato: formatoDe(i),
      autorIds:
        i % 4 === 0
          ? [autorIds[i % autorIds.length], autorIds[(i + 1) % autorIds.length]]
          : [autorIds[i % autorIds.length]],
      temaIds: [temaIds[i % temaIds.length]],
      ubicacionId: ubicacionIds[i % ubicacionIds.length],
      codigoBase: `INV-${String(i).padStart(4, '0')}`,
      copias: (i % 3) + 1,
      estado: (copia) => estadoDe(i + copia),
    });
  }

  console.log(
    `Semillas listas: ${await prisma.libro.count()} libros, ` +
      `${await prisma.ejemplar.count()} ejemplares, ${await prisma.usuario.count()} usuarios.`,
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
