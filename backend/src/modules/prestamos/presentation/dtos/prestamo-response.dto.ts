import { ApiProperty } from '@nestjs/swagger';

/** Clases solo para documentar las respuestas en Swagger. */
class Referencia {
  @ApiProperty({ format: 'uuid' }) id!: string;
}
class EjemplarRef extends Referencia {
  @ApiProperty({ example: 'INV-0000-1' }) codigoInventario!: string;
}
class LibroRef extends Referencia {
  @ApiProperty({ example: 'Cien años de soledad' }) titulo!: string;
}
class UsuarioRef extends Referencia {
  @ApiProperty({ example: 'Visitante Demo' }) nombre!: string;
  @ApiProperty({ example: 'publico@clena.example' }) email!: string;
}
class PersonalRef extends Referencia {
  @ApiProperty({ example: 'Personal Demo' }) nombre!: string;
}

export class PrestamoResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ enum: ['ACTIVO', 'VENCIDO', 'DEVUELTO'] }) estado!: string;
  @ApiProperty({ example: '2026-11-10T15:00:00.000Z' }) fechaPrestamo!: string;
  @ApiProperty({
    example: '2026-11-25',
    description: 'Día límite de devolución (hora de Colombia)',
  })
  fechaLimite!: string;
  @ApiProperty({ example: null, nullable: true, type: String })
  fechaDevolucion!: string | null;
  @ApiProperty({
    example: 15,
    nullable: true,
    type: Number,
    description:
      'Días para el límite; negativo = días de atraso; null si ya se devolvió',
  })
  diasRestantes!: number | null;
  @ApiProperty({ type: EjemplarRef }) ejemplar!: EjemplarRef;
  @ApiProperty({ type: LibroRef }) libro!: LibroRef;
  @ApiProperty({ type: UsuarioRef }) usuario!: UsuarioRef;
  @ApiProperty({ type: PersonalRef }) registradoPor!: PersonalRef;
}

export class PaginaPrestamosResponse {
  @ApiProperty({ type: [PrestamoResponse] }) items!: PrestamoResponse[];
  @ApiProperty({ example: 4 }) total!: number;
  @ApiProperty({ example: 1 }) pagina!: number;
  @ApiProperty({ example: 20 }) tamano!: number;
}
