import type { LucideIcon } from 'lucide-react';
import { MapPin, Search, SlidersHorizontal } from 'lucide-react';

export interface PasoTutorial {
  titulo: string;
  texto: string;
  ejemplo: string;
  icono: LucideIcon;
}

/** HU-32: dónde escribir, cómo usar los filtros y cómo leer la ubicación. */
export const PASOS_TUTORIAL: readonly PasoTutorial[] = [
  {
    titulo: 'Escriba lo que busca',
    texto:
      'En el campo «Buscar» escriba el título, el autor o el tema del libro y presione «Buscar en catálogo». No se preocupe si se equivoca en una letra o en una tilde: el buscador lo entiende igual.',
    ejemplo: 'Ejemplo: «garcia marquez» o «cien años de soledad».',
    icono: Search,
  },
  {
    titulo: 'Afine con los filtros',
    texto:
      'Si salen muchos resultados, use el panel «Filtros»: tipo de material, idioma, años de publicación o «Solo disponibles» para ver únicamente libros que puede llevarse hoy.',
    ejemplo: 'En el celular, los filtros aparecen antes de la lista de resultados.',
    icono: SlidersHorizontal,
  },
  {
    titulo: 'Lea dónde está el libro',
    texto:
      'Abra un resultado para ver su ficha. En «Ubicación» encontrará la sala, la sección y el estante, y si hay ejemplares disponibles. Con esos datos puede ir al estante o pedirlo en el mostrador.',
    ejemplo: 'Ejemplo: «Sala 1 · Sección Humanidades · Estante E-01».',
    icono: MapPin,
  },
];
