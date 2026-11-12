import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

const limpiar = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : value;

export class CrearUbicacionDto {
  @ApiProperty({ example: 'Sala 1', maxLength: 60 })
  @Transform(limpiar)
  @IsString()
  @IsNotEmpty({ message: 'Indica la sala' })
  @MaxLength(60)
  sala!: string;

  @ApiProperty({ example: 'Humanidades', maxLength: 60 })
  @Transform(limpiar)
  @IsString()
  @IsNotEmpty({ message: 'Indica la sección' })
  @MaxLength(60)
  seccion!: string;

  @ApiProperty({ example: 'E-01', maxLength: 30 })
  @Transform(limpiar)
  @IsString()
  @IsNotEmpty({ message: 'Indica el estante' })
  @MaxLength(30)
  estante!: string;
}
