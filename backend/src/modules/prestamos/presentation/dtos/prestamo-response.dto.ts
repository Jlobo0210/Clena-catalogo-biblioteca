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
  @ApiProperty({
    example: 0,
    nullable: true,
    type: Number,
    description: 'Días de retraso (0 si está al día); null si ya se devolvió',
  })
  diasRetraso!: number | null;
  @ApiProperty({ type: EjemplarRef }) ejemplar!: EjemplarRef;
  @ApiProperty({ type: LibroRef }) libro!: LibroRef;
  @ApiProperty({ type: UsuarioRef }) usuario!: UsuarioRef;
  @ApiProperty({ type: PersonalRef }) registradoPor!: PersonalRef;
}

/** HU-36: resumen del seguimiento de devoluciones. */
export class ResumenPrestamosResponse {
  @ApiProperty({ example: '2026-11-12', description: 'Hoy en Colombia' })
  hoy!: string;
  @ApiProperty({ example: 3 }) diasAviso!: number;
  @ApiProperty({ example: 7 }) sinDevolver!: number;
  @ApiProperty({ example: 2 }) vencidos!: number;
  @ApiProperty({ example: 1 }) porVencer!: number;
}

export class PaginaPrestamosResponse {
  @ApiProperty({ type: [PrestamoResponse] }) items!: PrestamoResponse[];
  @ApiProperty({ example: 4 }) total!: number;
  @ApiProperty({ example: 1 }) pagina!: number;
  @ApiProperty({ example: 20 }) tamano!: number;
}
