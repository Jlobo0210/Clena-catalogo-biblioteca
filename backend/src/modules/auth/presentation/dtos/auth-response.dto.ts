import { ApiProperty } from '@nestjs/swagger';
import { ROLES } from '../../domain/value-objects/rol';
import type { Rol } from '../../domain/value-objects/rol';

/** Clases solo para documentar las respuestas en Swagger. */
export class UsuarioResponse {
  @ApiProperty({ format: 'uuid' }) id!: string;
  @ApiProperty({ example: 'Ana Pérez' }) nombre!: string;
  @ApiProperty({ example: 'ana@example.com' }) email!: string;
  @ApiProperty({ enum: ROLES }) rol!: Rol;
  @ApiProperty({ example: '2026-11-07T15:00:00.000Z' })
  consentimientoPrivacidadEn!: string;
  @ApiProperty({ example: '1.0' }) versionAvisoPrivacidad!: string;
  @ApiProperty({ example: '2026-11-07T15:00:00.000Z' }) creadoEn!: string;
}

export class SesionResponse {
  @ApiProperty() accessToken!: string;
  @ApiProperty() refreshToken!: string;
  @ApiProperty({ example: 'Bearer' }) tokenType!: 'Bearer';
  @ApiProperty({
    example: 900,
    description: 'Segundos de vida del access token',
  })
  expiresIn!: number;
  @ApiProperty({ type: UsuarioResponse }) usuario!: UsuarioResponse;
}

export class PaginaUsuariosResponse {
  @ApiProperty({ type: [UsuarioResponse] }) items!: UsuarioResponse[];
  @ApiProperty({ example: 3 }) total!: number;
  @ApiProperty({ example: 1 }) pagina!: number;
  @ApiProperty({ example: 20 }) tamano!: number;
}

export class AvisoPrivacidadResponse {
  @ApiProperty({ example: '1.0' }) version!: string;
  @ApiProperty() responsable!: string;
  @ApiProperty({ type: [String] }) datosRecolectados!: string[];
  @ApiProperty({ type: [String] }) finalidades!: string[];
  @ApiProperty() derechos!: string;
  @ApiProperty() texto!: string;
}
