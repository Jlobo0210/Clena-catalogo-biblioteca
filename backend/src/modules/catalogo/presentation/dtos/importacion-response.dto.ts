import { ApiProperty } from '@nestjs/swagger';

/** Clases solo para documentar las respuestas en Swagger. */
export class ErrorFilaResponse {
  @ApiProperty({
    example: 4,
    description: 'Línea del archivo (la cabecera es la 1)',
  })
  fila!: number;

  @ApiProperty({
    type: [String],
    example: [
      'El ISBN no es válido: debe ser un ISBN-10 o ISBN-13 con dígito de control correcto',
    ],
  })
  errores!: string[];
}

export class ReporteImportacionResponse {
  @ApiProperty({ example: 120 }) totalFilas!: number;
  @ApiProperty({
    type: [String],
    example: ['observaciones'],
    description:
      'Columnas del archivo que no son de la plantilla: no se importan (revisa que el nombre esté bien escrito)',
  })
  columnasIgnoradas!: string[];
  @ApiProperty({ example: 117 }) filasImportadas!: number;
  @ApiProperty({ example: 3 }) filasConError!: number;
  @ApiProperty({ example: 80 }) librosCreados!: number;
  @ApiProperty({
    example: 37,
    description:
      'Filas cuyo libro ya existía (mismo ISBN, o mismo título y autores)',
  })
  librosExistentes!: number;
  @ApiProperty({ example: 110 }) ejemplaresCreados!: number;
  @ApiProperty({
    example: 0,
    description: 'Ejemplares ya registrados con ese código en el mismo libro',
  })
  ejemplaresExistentes!: number;
  @ApiProperty({ example: 25 }) autoresCreados!: number;
  @ApiProperty({ example: 4 }) temasCreados!: number;
  @ApiProperty({ example: 6 }) ubicacionesCreadas!: number;
  @ApiProperty({ type: [ErrorFilaResponse] }) errores!: ErrorFilaResponse[];
}
