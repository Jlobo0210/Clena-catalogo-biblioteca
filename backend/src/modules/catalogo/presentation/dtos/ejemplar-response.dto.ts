import { ApiProperty } from '@nestjs/swagger';
import { ESTADOS_EJEMPLAR } from '../../domain/value-objects/estado-ejemplar';
import type { EstadoEjemplar } from '../../domain/value-objects/estado-ejemplar';

export class UbicacionResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Sala A' }) sala!: string;
  @ApiProperty({ example: 'Ciencias' }) seccion!: string;
  @ApiProperty({ example: 'E-04' }) estante!: string;
  @ApiProperty({ example: 'A-CIE-E04' }) codigo!: string;
}

export class EjemplarResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ format: 'uuid' }) libroId!: string;
  @ApiProperty({ type: UbicacionResponse }) ubicacion!: UbicacionResponse;
  @ApiProperty({ example: 'INV-00123' }) codigoInventario!: string;
  @ApiProperty({ enum: ESTADOS_EJEMPLAR }) estado!: EstadoEjemplar;
  @ApiProperty({ nullable: true, type: String }) observaciones!: string | null;
  @ApiProperty({ example: '2026-11-08T15:00:00.000Z' }) creadoEn!: string;
  @ApiProperty({ example: '2026-11-08T15:00:00.000Z' }) actualizadoEn!: string;
}

export class DisponibilidadResponse {
  @ApiProperty({ format: 'uuid' }) libroId!: string;
  @ApiProperty({ example: 3 }) totalEjemplares!: number;
  @ApiProperty({ example: 2 }) disponibles!: number;
  @ApiProperty({ example: true }) disponible!: boolean;
}

export class ListaEjemplaresResponse {
  @ApiProperty({ type: [EjemplarResponse] }) items!: EjemplarResponse[];
  @ApiProperty({ type: DisponibilidadResponse })
  disponibilidad!: DisponibilidadResponse;
}
