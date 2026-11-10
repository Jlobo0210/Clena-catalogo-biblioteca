import { EstadoEjemplar } from '../value-objects/estado-ejemplar';
import { Formato } from '../value-objects/formato';
import { TipoMaterial } from '../value-objects/tipo-material';

/** Una fila del CSV ya validada y normalizada, lista para guardarse (HU-19). */
export interface FilaCatalogo {
  libro: {
    titulo: string;
    anioPublicacion: number | null;
    idioma: string;
    isbn: string | null;
    tipoMaterial: TipoMaterial;
    formato: Formato;
    enlaceDigital: string | null;
  };
  /** Nombres de autores, en orden. Los que no existan se crean. */
  autores: string[];
  /** Nombres de temas. Los que no existan se crean. */
  temas: string[];
  /** Si la fila trae código de inventario, también se registra el ejemplar. */
  ejemplar: {
    codigoInventario: string;
    estado: EstadoEjemplar;
    sala: string;
    seccion: string;
    estante: string;
  } | null;
}

export interface ResultadoFila {
  libro: 'creado' | 'existente';
  ejemplar: 'creado' | 'existente' | null;
  autoresCreados: number;
  temasCreados: number;
  ubicacionCreada: boolean;
}

/**
 * Puerto que guarda una fila completa en una sola transacción: si algo falla,
 * no queda nada a medias. La implementación con Prisma vive en infraestructura.
 *
 * Reglas:
 *  - Los autores y temas se buscan por nombre sin distinguir mayúsculas; si no existen, se crean.
 *  - El libro se busca por ISBN; sin ISBN, por título y los mismos autores. Si existe, no se duplica
 *    ni se modifica.
 *  - El ejemplar se busca por código de inventario. Si ya existe en el mismo libro, no se repite;
 *    si existe en otro libro, la fila falla con ConflictError.
 *  - La ubicación se busca por sala, sección y estante; si no existe, se crea.
 */
export interface ImportadorCatalogo {
  importarFila(fila: FilaCatalogo): Promise<ResultadoFila>;
}

export const IMPORTADOR_CATALOGO = Symbol('IMPORTADOR_CATALOGO');
