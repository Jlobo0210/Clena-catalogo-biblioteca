import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Formato único de error de toda la API. Lo produce AllExceptionsFilter
 * y se documenta en Swagger para que el frontend sepa qué esperar.
 */
export class ErrorResponse {
  @ApiProperty({ example: 400 })
  statusCode!: number;

  @ApiProperty({
    example: 'VALIDATION_ERROR',
    description:
      'Código estable para el frontend: VALIDATION_ERROR, NOT_FOUND, CONFLICT, UNAUTHORIZED, FORBIDDEN, SERVICE_UNAVAILABLE, INTERNAL_ERROR…',
  })
  error!: string;

  @ApiProperty({ example: 'Los datos enviados no son válidos' })
  message!: string;

  @ApiPropertyOptional({
    example: ['nombre should not be empty'],
    description: 'Detalle adicional, p. ej. la lista de campos inválidos',
  })
  details?: unknown;

  @ApiProperty({ example: '/api/v1/temas' })
  path!: string;

  @ApiProperty({ example: '2026-11-03T23:30:00.000Z' })
  timestamp!: string;

  @ApiPropertyOptional({
    example: 'b1c2…',
    description: 'Id de la petición, igual al de los logs',
  })
  requestId?: string;
}
