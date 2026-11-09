import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import {
  ESTADOS_EJEMPLAR,
} from '../../domain/value-objects/estado-ejemplar';
import type { EstadoEjemplar } from '../../domain/value-objects/estado-ejemplar';

export class CrearEjemplarDto {
  @ApiProperty({ format: 'uuid', description: 'ID de la ubicación (sala, sección, estante)' })
  @IsUUID()
  ubicacionId!: string;

  @ApiProperty({ example: 'INV-00123', maxLength: 40 })
  @IsString()
  @MaxLength(40)
  codigoInventario!: string;

  @ApiPropertyOptional({ enum: ESTADOS_EJEMPLAR, default: 'DISPONIBLE' })
  @IsOptional()
  @IsIn(ESTADOS_EJEMPLAR)
  estado?: EstadoEjemplar;

  @ApiPropertyOptional({ example: 'Lomo deteriorado', maxLength: 500, nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  observaciones?: string | null;
}

/** Todos los campos son opcionales; se aplica solo lo que se envía. */
export class ActualizarEjemplarDto extends PartialType(CrearEjemplarDto) {}
