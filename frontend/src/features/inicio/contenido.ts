import { BookOpen, Newspaper, ScrollText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { construirUrlBusqueda } from '../busqueda/parametrosBusqueda';

export interface EventoAgenda {
  id: string;
  etiqueta: string;
  fecha: string;
  titulo: string;
  descripcion: string;
  accion: string;
  variante: 'ambar' | 'gris';
}

export const agendaCultural: EventoAgenda[] = [
  {
    id: 'exposicion-centenaria-prensa',
    etiqueta: 'Exposición patrimonial',
    fecha: '15 Oct, 2026',
    titulo: 'Exposición Centenaria de Prensa del Caribe: Memorias de El Heraldo y El Promotor',
    descripcion:
      'Inauguración en la Sala de Hemeroteca con ejemplares originales impresos desde finales del siglo XIX y crónicas históricas.',
    accion: 'Leer más y detalles',
    variante: 'ambar',
  },
  {
    id: 'taller-restauracion',
    etiqueta: 'Taller abierto',
    fecha: '24 Oct · 10:00 a.m.',
    titulo: 'Taller de Restauración y Preservación de Manuscritos Coloniales',
    descripcion:
      'Dirigido a investigadores, estudiantes y público general en las instalaciones del Archivo Histórico Departamental.',
    accion: 'Inscripción gratuita',
    variante: 'gris',
  },
  {
    id: 'club-lectura-infantil',
    etiqueta: 'Fomento a la lectura',
    fecha: 'Miér. y Viernes',
    titulo: 'Club de Lectura Infantil y Juvenil: Relatos del Río Magdalena',
    descripcion:
      'Sesiones interactivas de narración oral y lectura compartida en la Sala Infantil con entrada libre y cupos abiertos.',
    accion: 'Conocer programación',
    variante: 'ambar',
  },
  {
    id: 'archivo-digital',
    etiqueta: 'Novedad digital',
    fecha: 'En curso',
    titulo: 'Digitalización del Archivo Gráfico y Fotográfico de Barranquilla',
    descripcion:
      'Más de 2.000 imágenes patrimoniales de arquitectura republicana y actividad portuaria ahora en terminales de sala.',
    accion: 'Consultar repositorio',
    variante: 'gris',
  },
];

export interface AccesoDirecto {
  titulo: string;
  descripcion: string;
  accion: string;
  icono: LucideIcon;
  destino: string;
  variante: 'azul' | 'clara';
}

export const accesosDirectos: AccesoDirecto[] = [
  {
    titulo: 'Catálogo general',
    descripcion:
      'Busque por autor, título o código topográfico en los estantes de todas las salas de lectura.',
    accion: 'Consultar acervo',
    icono: BookOpen,
    destino: construirUrlBusqueda(),
    variante: 'azul',
  },
  {
    titulo: 'Archivo Histórico',
    descripcion:
      'Documentos fundacionales, actas coloniales, cartas de época y cartografía original protegida.',
    accion: 'Explorar legajos',
    icono: ScrollText,
    destino: construirUrlBusqueda({ ambito: 'archivo' }),
    variante: 'clara',
  },
  {
    titulo: 'Hemeroteca histórica',
    descripcion:
      'Ediciones originales de diarios del siglo XIX y XX, gacetas oficiales y revistas literarias.',
    accion: 'Consultar prensa',
    icono: Newspaper,
    destino: construirUrlBusqueda({ ambito: 'prensa' }),
    variante: 'clara',
  },
];
