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
} from 'class-validator';
import type { OrdenAutores } from '../../domain/repositories/autor.repository';

const ORDENES: OrdenAutores[] = ['nombre', 'creadoEn'];
const DIRECCIONES = ['asc', 'desc'] as const;

export class CrearAutorDto {
  @ApiProperty({ example: 'Gabriel García Márquez', maxLength: 200 })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value,
  )
  @IsString()
  @IsNotEmpty({ message: 'El nombre del autor es obligatorio' })
  @MaxLength(200, {
    message: 'El nombre del autor no puede superar 200 caracteres',
  })
  nombre!: string;
}

/** Todos los campos son opcionales. */
export class ActualizarAutorDto extends PartialType(CrearAutorDto) {}

export class ListarAutoresQueryDto {
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
  @MaxLength(200)
  nombre?: string;

  @ApiPropertyOptional({ enum: ORDENES, default: 'nombre' })
  @IsOptional()
  @IsIn(ORDENES)
  ordenarPor?: OrdenAutores;

  @ApiPropertyOptional({
    enum: DIRECCIONES,
    default: 'asc',
  })
  @IsOptional()
  @IsIn(DIRECCIONES)
  direccion?: (typeof DIRECCIONES)[number];
}
