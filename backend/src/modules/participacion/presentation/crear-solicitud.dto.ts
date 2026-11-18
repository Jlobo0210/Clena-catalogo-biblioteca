import { Transform } from 'class-transformer';
import {
  IsEmail,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import type { TipoParticipacion } from '../domain/solicitud';

function limpiar(value: unknown): unknown {
  // Se eliminan caracteres de control antes de validar y almacenar texto.
  return typeof value === 'string'
    ? value
        // eslint-disable-next-line no-control-regex
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
        .trim()
    : value;
}

export class CrearSolicitudDto {
  @IsIn(['LIBRO', 'SUGERENCIA', 'QUEJA', 'FELICITACION'])
  tipo!: TipoParticipacion;

  @Transform(({ value }: { value: unknown }) => limpiar(value))
  @ValidateIf(
    (o: CrearSolicitudDto) => o.tipo === 'LIBRO' || o.titulo !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(300)
  titulo?: string;

  @Transform(({ value }: { value: unknown }) => limpiar(value))
  @ValidateIf(
    (o: CrearSolicitudDto) => o.tipo === 'LIBRO' || o.autor !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  autor?: string;

  @Transform(({ value }: { value: unknown }) => limpiar(value))
  @ValidateIf(
    (o: CrearSolicitudDto) => o.tipo !== 'LIBRO' || o.mensaje !== undefined,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(3000)
  mensaje?: string;

  @Transform(({ value }: { value: unknown }) => limpiar(value))
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre?: string;

  @Transform(({ value }: { value: unknown }) => limpiar(value))
  @IsOptional()
  @IsEmail()
  @MaxLength(254)
  correo?: string;
}
