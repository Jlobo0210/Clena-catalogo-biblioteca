import { BookOpen, Newspaper, ScrollText } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { construirUrlBusqueda } from '../busqueda/parametrosBusqueda';

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
