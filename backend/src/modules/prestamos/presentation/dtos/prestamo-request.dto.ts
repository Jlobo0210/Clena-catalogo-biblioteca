import { ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsISO8601,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import type { EstadoConsultaPrestamo } from '../../application/dtos/prestamo.dto';
import type { OrdenPrestamos } from '../../domain/repositories/prestamo.repository';

const ESTADOS: EstadoConsultaPrestamo[] = [
  'SIN_DEVOLVER',
  'VENCIDO',
  'POR_VENCER',
  'DEVUELTO',
];
const FORMATO_DIA = /^\d{4}-\d{2}-\d{2}$/;

/** Días que cuentan como «próximo a vencer» (HU-36). */
class DiasAvisoQueryDto {
  @ApiPropertyOptional({
    default: 3,
    minimum: 1,
    maximum: 30,
    description: 'Días que cuentan como «próximo a vencer»',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'diasAviso debe ser un número entero' })
  @Min(1)
  @Max(30)
  diasAviso?: number;
}
const ORDENES: OrdenPrestamos[] = ['fechaPrestamo', 'fechaLimite'];
const DIRECCIONES = ['asc', 'desc'] as const;

/** Ejemplar: ejemplarId o codigoInventario. Usuario: usuarioId o usuarioEmail. */
export class RegistrarPrestamoDto {
  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'ejemplarId debe ser un UUID' })
  ejemplarId?: string;

  @ApiPropertyOptional({
    example: 'INV-0000-1',
    description: 'Código de inventario pegado en el libro',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  codigoInventario?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4', { message: 'usuarioId debe ser un UUID' })
  usuarioId?: string;

  @ApiPropertyOptional({ example: 'publico@clena.example' })
  @IsOptional()
  @IsEmail({}, { message: 'El correo del usuario no es válido' })
  @MaxLength(254)
  usuarioEmail?: string;
}

export class ListarPrestamosQueryDto extends DiasAvisoQueryDto {
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
    enum: ESTADOS,
    description:
      'SIN_DEVOLVER incluye los vencidos; POR_VENCER: sin devolver y con límite entre hoy y los próximos diasAviso días',
  })
  @IsOptional()
  @IsIn(ESTADOS)
  estado?: EstadoConsultaPrestamo;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  usuarioId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  ejemplarId?: string;

  @ApiPropertyOptional({
    example: '2026-11-01',
    description: 'Fecha límite desde este día (incluido)',
  })
  @IsOptional()
  @Matches(FORMATO_DIA, {
    message: 'limiteDesde debe tener el formato AAAA-MM-DD',
  })
  @IsISO8601(
    { strict: true },
    { message: 'limiteDesde no es una fecha válida' },
  )
  limiteDesde?: string;

  @ApiPropertyOptional({
    example: '2026-11-30',
    description: 'Fecha límite hasta este día (incluido)',
  })
  @IsOptional()
  @Matches(FORMATO_DIA, {
    message: 'limiteHasta debe tener el formato AAAA-MM-DD',
  })
  @IsISO8601(
    { strict: true },
    { message: 'limiteHasta no es una fecha válida' },
  )
  limiteHasta?: string;

  @ApiPropertyOptional({ enum: ORDENES, default: 'fechaPrestamo' })
  @IsOptional()
  @IsIn(ORDENES)
  ordenarPor?: OrdenPrestamos;

  @ApiPropertyOptional({ enum: DIRECCIONES, default: 'desc' })
  @IsOptional()
  @IsIn(DIRECCIONES)
  direccion?: (typeof DIRECCIONES)[number];
}

/** HU-27: mismos filtros, sin usuario, ejemplar ni rango de fechas (el usuario sale del token). */
export class MisPrestamosQueryDto extends OmitType(ListarPrestamosQueryDto, [
  'usuarioId',
  'ejemplarId',
  'limiteDesde',
  'limiteHasta',
] as const) {}

/** HU-36: parámetros del resumen de préstamos pendientes. */
export class ResumenPrestamosQueryDto extends DiasAvisoQueryDto {}
