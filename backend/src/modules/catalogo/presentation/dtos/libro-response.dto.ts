import { ApiProperty } from '@nestjs/swagger';
import { FORMATOS } from '../../domain/value-objects/formato';
import type { Formato } from '../../domain/value-objects/formato';
import { TIPOS_MATERIAL } from '../../domain/value-objects/tipo-material';
import type { TipoMaterial } from '../../domain/value-objects/tipo-material';

/** Clases solo para documentar las respuestas en Swagger. */
export class ReferenciaResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Gabriel García Márquez' }) nombre!: string;
}

export class LibroResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Cien años de soledad' }) titulo!: string;
  @ApiProperty({ example: 1967, nullable: true, type: Number })
  anioPublicacion!: number | null;
  @ApiProperty({ example: 'es' }) idioma!: string;
  @ApiProperty({ example: '9780306406157', nullable: true, type: String })
  isbn!: string | null;
  @ApiProperty({ enum: TIPOS_MATERIAL }) tipoMaterial!: TipoMaterial;
  @ApiProperty({ enum: FORMATOS }) formato!: Formato;
  @ApiProperty({ nullable: true, type: String }) enlaceDigital!: string | null;
  @ApiProperty({ type: [ReferenciaResponse] }) autores!: ReferenciaResponse[];
  @ApiProperty({ type: [ReferenciaResponse] }) temas!: ReferenciaResponse[];
  @ApiProperty({ example: '2026-11-08T15:00:00.000Z' }) creadoEn!: string;
  @ApiProperty({ example: '2026-11-08T15:00:00.000Z' }) actualizadoEn!: string;
}

export class PaginaLibrosResponse {
  @ApiProperty({ type: [LibroResponse] }) items!: LibroResponse[];
  @ApiProperty({ example: 50 }) total!: number;
  @ApiProperty({ example: 1 }) pagina!: number;
  @ApiProperty({ example: 20 }) tamano!: number;
}
