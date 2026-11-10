import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import type { OrdenTemas } from '../../domain/repositories/tema.repository';

const ORDENES: OrdenTemas[] = ['nombre', 'creadoEn'];
const DIRECCIONES = ['asc', 'desc'] as const;

export class CrearTemaDto {
  @ApiProperty({ example: 'Historia del Caribe', maxLength: 120 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'El nombre del tema es obligatorio' })
  @MaxLength(120, {
    message: 'El nombre del tema no puede superar 120 caracteres',
  })
  nombre!: string;

  @ApiPropertyOptional({
    example: 'Libros sobre la historia de Barranquilla y la región Caribe.',
    maxLength: 500,
    nullable: true,
    description: 'Opcional. null o texto vacío la borran.',
  })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(500, {
    message: 'La descripción del tema no puede superar 500 caracteres',
  })
  descripcion?: string | null;
}

/** Todos los campos son opcionales. */
export class ActualizarTemaDto extends PartialType(CrearTemaDto) {}

export class ListarTemasQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pagina?: number;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  tamano?: number;

  @ApiPropertyOptional({
    description: 'Busca por nombre (sin distinguir mayúsculas)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombre?: string;

  @ApiPropertyOptional({ enum: ORDENES, default: 'nombre' })
  @IsOptional()
  @IsIn(ORDENES)
  ordenarPor?: OrdenTemas;

  @ApiPropertyOptional({ enum: DIRECCIONES, default: 'asc' })
  @IsOptional()
  @IsIn(DIRECCIONES)
  direccion?: (typeof DIRECCIONES)[number];
}
