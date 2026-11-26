import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  Equals,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ROLES } from '../../domain/value-objects/rol';
import type { Rol } from '../../domain/value-objects/rol';

export class RegistroDto {
  @ApiProperty({ example: 'Ana Pérez' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  nombre!: string;

  @ApiProperty({ example: 'ana@example.com' })
  @IsEmail({}, { message: 'El correo electrónico no es válido' })
  @MaxLength(254)
  email!: string;

  @ApiProperty({
    example: 'clave-segura-1',
    description: '8 a 72 caracteres, con al menos una letra y un número',
  })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @ApiProperty({
    example: true,
    description:
      'Aceptación explícita del aviso de privacidad (Ley 1581 de 2012). Debe ser true.',
  })
  @IsBoolean()
  @Equals(true, { message: 'Debes aceptar el aviso de privacidad' })
  aceptaAvisoPrivacidad!: boolean;
}

export class LoginDto {
  @ApiProperty({ example: 'publico@clena.test' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(254)
  email!: string;

  @ApiProperty({ example: 'tu-contraseña' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(72)
  password!: string;
}

export class RefreshDto {
  @ApiProperty({ description: 'Refresh token recibido al iniciar sesión' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  refreshToken!: string;
}

export class ListarUsuariosQueryDto {
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

  @ApiPropertyOptional({ enum: ROLES })
  @IsOptional()
  @IsIn(ROLES)
  rol?: Rol;

  @ApiPropertyOptional({ description: 'Busca en nombre o correo' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  texto?: string;
}

export class CambiarRolDto {
  @ApiProperty({ enum: ROLES, example: 'PERSONAL' })
  @IsIn(ROLES, { message: 'El rol debe ser ADMINISTRADOR, PERSONAL o PUBLICO' })
  rol!: Rol;
}

/** HU-34: confirmación para eliminar la cuenta. */
export class EliminarCuentaDto {
  @ApiProperty({ example: 'tu-contraseña' })
  @IsString()
  @IsNotEmpty({ message: 'Escribe tu contraseña para confirmar' })
  @MaxLength(72)
  password!: string;
}
