import { EstadoEjemplar } from '../../domain/value-objects/estado-ejemplar';

/** DTOs de la capa de aplicación para ejemplares y ubicaciones. */

export interface CrearEjemplarInput {
  ubicacionId: string;
  codigoInventario: string;
  estado?: EstadoEjemplar;
  observaciones?: string | null;
}

export type ActualizarEjemplarInput = Partial<CrearEjemplarInput>;

export interface UbicacionOutput {
  id: string;
  sala: string;
  seccion: string;
  estante: string;
  codigo: string;
}

export interface EjemplarOutput {
  id: string;
  libroId: string;
  ubicacion: UbicacionOutput;
  codigoInventario: string;
  estado: EstadoEjemplar;
  observaciones: string | null;
  creadoEn: string;
  actualizadoEn: string;
}

export interface DisponibilidadOutput {
  libroId: string;
  totalEjemplares: number;
  disponibles: number;
  disponible: boolean;
  /** ISO 8601. Solo presente cuando disponibles === 0. */
  proximaDevolucion: string | null;
}
