import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class ConfiguracionDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\S/)
  @MaxLength(1000)
  horarios!: string;

  @IsString()
  @Matches(/^\+?[0-9][0-9 ()-]{5,28}[0-9]$/)
  telefono!: string;

  @IsEmail()
  @MaxLength(254)
  correo!: string;
}
