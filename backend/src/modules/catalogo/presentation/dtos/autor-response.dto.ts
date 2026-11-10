import { ApiProperty } from '@nestjs/swagger';

/** Clases solo para documentar las respuestas en Swagger. */
export class AutorResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Gabriel García Márquez' }) nombre!: string;
  @ApiProperty({ example: '2026-11-08T15:00:00.000Z' }) creadoEn!: string;
  @ApiProperty({ example: '2026-11-08T15:00:00.000Z' }) actualizadoEn!: string;
}

export class PaginaAutoresResponse {
  @ApiProperty({ type: [AutorResponse] }) items!: AutorResponse[];
  @ApiProperty({ example: 50 }) total!: number;
  @ApiProperty({ example: 1 }) pagina!: number;
  @ApiProperty({ example: 20 }) tamano!: number;
}
