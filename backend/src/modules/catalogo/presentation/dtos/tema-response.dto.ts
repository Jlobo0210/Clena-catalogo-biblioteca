import { ApiProperty } from '@nestjs/swagger';

/** Clases solo para documentar las respuestas en Swagger. */
export class TemaResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Historia del Caribe' }) nombre!: string;
  @ApiProperty({
    example: 'Libros sobre la historia de Barranquilla y la región Caribe.',
    nullable: true,
    type: String,
  })
  descripcion!: string | null;
  @ApiProperty({ example: 12, description: 'Libros clasificados en el tema' })
  totalLibros!: number;
  @ApiProperty({ example: '2026-11-08T15:00:00.000Z' }) creadoEn!: string;
  @ApiProperty({ example: '2026-11-08T15:00:00.000Z' }) actualizadoEn!: string;
}

export class PaginaTemasResponse {
  @ApiProperty({ type: [TemaResponse] }) items!: TemaResponse[];
  @ApiProperty({ example: 8 }) total!: number;
  @ApiProperty({ example: 1 }) pagina!: number;
  @ApiProperty({ example: 20 }) tamano!: number;
}
