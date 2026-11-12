import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  IsBoolean,
  IsUUID,
  Length,
  Max,
  MaxLength,
  MinLength,
  Min,
} from 'class-validator';
import type {
  Direccion,
  OrdenLibros,
} from '../../domain/repositories/libro.repository';
import { FORMATOS } from '../../domain/value-objects/formato';
import type { Formato } from '../../domain/value-objects/formato';
import { TIPOS_MATERIAL } from '../../domain/value-objects/tipo-material';
import type { TipoMaterial } from '../../domain/value-objects/tipo-material';

const ORDENES: OrdenLibros[] = ['titulo', 'anio', 'creadoEn'];
const DIRECCIONES: Direccion[] = ['asc', 'desc'];

export class CrearLibroDto {
  @ApiProperty({ example: 'Cien años de soledad', maxLength: 300 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  titulo!: string;

  @ApiPropertyOptional({ example: 1967, nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1000)
  @Max(9999)
  anioPublicacion?: number | null;

  @ApiProperty({ example: 'es', description: 'Código ISO 639-1' })
  @IsString()
  @Length(2, 2)
  idioma!: string;

  @ApiPropertyOptional({
    example: '978-0-306-40615-7',
    nullable: true,
    description: 'ISBN-10 o ISBN-13, con o sin guiones. Único cuando existe.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  isbn?: string | null;

  @ApiPropertyOptional({ enum: TIPOS_MATERIAL, default: 'LIBRO' })
  @IsOptional()
  @IsIn(TIPOS_MATERIAL)
  tipoMaterial?: TipoMaterial;

  @ApiPropertyOptional({ enum: FORMATOS, default: 'FISICO' })
  @IsOptional()
  @IsIn(FORMATOS)
  formato?: Formato;

  @ApiPropertyOptional({
    example: 'https://biblioteca.example/digital/cien-anos-de-soledad',
    nullable: true,
    description: 'Obligatorio si el formato es DIGITAL o FISICO_Y_DIGITAL',
  })
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true },
    { message: 'El enlace digital debe ser una URL http(s)' },
  )
  @MaxLength(500)
  enlaceDigital?: string | null;

  @ApiProperty({
    type: [String],
    format: 'uuid',
    description: 'Ids de los autores, en el orden en que se muestran',
  })
  @IsArray()
  @ArrayNotEmpty({ message: 'Un libro debe tener al menos un autor' })
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  autorIds!: string[];

  @ApiPropertyOptional({ type: [String], format: 'uuid' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsUUID('all', { each: true })
  temaIds?: string[];
}

/** Todos los campos son opcionales; autorIds y temaIds reemplazan la lista completa. */
export class ActualizarLibroDto extends PartialType(CrearLibroDto) {}

export class ListarLibrosQueryDto {
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
    description:
      'Busca en el título. Para buscar también en autores y temas, usa /libros/buscar',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  texto?: string;

  @ApiPropertyOptional({ example: 'es' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  idioma?: string;

  @ApiPropertyOptional({ enum: TIPOS_MATERIAL })
  @IsOptional()
  @IsIn(TIPOS_MATERIAL)
  tipoMaterial?: TipoMaterial;

  @ApiPropertyOptional({ enum: FORMATOS })
  @IsOptional()
  @IsIn(FORMATOS)
  formato?: Formato;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  autorId?: string;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  temaId?: string;

  @ApiPropertyOptional({ example: 1990 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anioDesde?: number;

  @ApiPropertyOptional({ example: 2020 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anioHasta?: number;

  @ApiPropertyOptional({ enum: ORDENES, default: 'titulo' })
  @IsOptional()
  @IsIn(ORDENES)
  ordenarPor?: OrdenLibros;

  @ApiPropertyOptional({ enum: DIRECCIONES, default: 'asc' })
  @IsOptional()
  @IsIn(DIRECCIONES)
  direccion?: Direccion;
}

const ORDENES_BUSQUEDA = ['relevancia', 'titulo', 'anio'] as const;
type OrdenBusqueda = (typeof ORDENES_BUSQUEDA)[number];

export class BuscarLibrosQueryDto {
  @ApiProperty({
    example: 'garcia marquez',
    minLength: 2,
    maxLength: 100,
    description: 'Título, autor o tema en un solo campo',
  })
  @IsString()
  @MinLength(2, { message: 'Escribe al menos 2 caracteres para buscar' })
  @MaxLength(100)
  q!: string;

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

  // ── HU-22: filtros ──────────────────────────────────────────────────────

  @ApiPropertyOptional({ example: 'es', description: 'Código ISO 639-1' })
  @IsOptional()
  @IsString()
  @Length(2, 2)
  idioma?: string;

  @ApiPropertyOptional({ enum: TIPOS_MATERIAL })
  @IsOptional()
  @IsIn(TIPOS_MATERIAL)
  tipoMaterial?: TipoMaterial;

  @ApiPropertyOptional({ format: 'uuid' })
  @IsOptional()
  @IsUUID()
  temaId?: string;

  @ApiPropertyOptional({ example: 1990 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anioDesde?: number;

  @ApiPropertyOptional({ example: 2024 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  anioHasta?: number;

  @ApiPropertyOptional({
    description: 'true para mostrar solo libros con ejemplares disponibles',
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  soloDisponibles?: boolean;

  // ── HU-22: ordenamiento ─────────────────────────────────────────────────

  @ApiPropertyOptional({
    enum: ORDENES_BUSQUEDA,
    default: 'relevancia',
    description: 'Criterio de ordenamiento',
  })
  @IsOptional()
  @IsIn(ORDENES_BUSQUEDA)
  ordenarPor?: OrdenBusqueda;

  @ApiPropertyOptional({ enum: DIRECCIONES, default: 'desc' })
  @IsOptional()
  @IsIn(DIRECCIONES)
  direccion?: Direccion;
}
