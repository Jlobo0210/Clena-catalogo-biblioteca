import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import type {
  FiltroEstadoPrestamo,
  OrdenPrestamos,
} from '../../domain/repositories/prestamo.repository';

const ESTADOS: FiltroEstadoPrestamo[] = ['SIN_DEVOLVER', 'VENCIDO', 'DEVUELTO'];
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

export class ListarPrestamosQueryDto {
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
    description: 'SIN_DEVOLVER incluye los vencidos',
  })
  @IsOptional()
  @IsIn(ESTADOS)
  estado?: FiltroEstadoPrestamo;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  usuarioId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID('4')
  ejemplarId?: string;

  @ApiPropertyOptional({ enum: ORDENES, default: 'fechaPrestamo' })
  @IsOptional()
  @IsIn(ORDENES)
  ordenarPor?: OrdenPrestamos;

  @ApiPropertyOptional({ enum: DIRECCIONES, default: 'desc' })
  @IsOptional()
  @IsIn(DIRECCIONES)
  direccion?: (typeof DIRECCIONES)[number];
}
