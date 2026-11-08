import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainError } from '../../domain/domain-error';
import { ErrorResponse } from '../http/error-response';

/** Código HTTP para cada código de error de dominio. */
const DOMAIN_STATUS: Record<string, number> = {
  VALIDATION_ERROR: HttpStatus.BAD_REQUEST,
  NOT_FOUND: HttpStatus.NOT_FOUND,
  CONFLICT: HttpStatus.CONFLICT,
  UNAUTHORIZED: HttpStatus.UNAUTHORIZED,
  FORBIDDEN: HttpStatus.FORBIDDEN,
};

/** Código estable para cada estado HTTP que lanza Nest o una librería. */
const HTTP_CODES: Record<number, string> = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  413: 'PAYLOAD_TOO_LARGE',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  503: 'SERVICE_UNAVAILABLE',
};

type Body = Omit<ErrorResponse, 'path' | 'timestamp' | 'requestId'>;

/**
 * Filtro global: toda excepción sale con el mismo formato (ErrorResponse).
 * - DomainError (dominio) -> 400 / 401 / 403 / 404 / 409 según su código.
 * - HttpException (Nest, ValidationPipe, guards, terminus) -> su estado.
 * - Cualquier otra cosa -> 500 sin filtrar detalles internos al cliente.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request & { id?: string | number }>();
    const res = ctx.getResponse<Response>();

    const body = this.toBody(exception);
    if (body.statusCode >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    const payload: ErrorResponse = {
      ...body,
      path: req.originalUrl ?? req.url,
      timestamp: new Date().toISOString(),
      ...(req.id !== undefined ? { requestId: String(req.id) } : {}),
    };
    res.status(body.statusCode).json(payload);
  }

  toBody(exception: unknown): Body {
    if (exception instanceof DomainError) {
      return {
        statusCode: DOMAIN_STATUS[exception.code] ?? HttpStatus.BAD_REQUEST,
        error: exception.code,
        message: exception.message,
      };
    }

    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const error = HTTP_CODES[statusCode] ?? 'HTTP_ERROR';

      if (typeof response === 'string') {
        return { statusCode, error, message: response };
      }

      const r = response as Record<string, unknown>;
      // ValidationPipe devuelve { message: string[] }
      if (Array.isArray(r.message)) {
        return {
          statusCode,
          error: 'VALIDATION_ERROR',
          message: 'Los datos enviados no son válidos',
          details: r.message,
        };
      }
      if (typeof r.message === 'string') {
        return { statusCode, error, message: r.message };
      }
      // Respuestas con estructura propia (p. ej. el health check de terminus)
      return {
        statusCode,
        error,
        message:
          statusCode === 503
            ? 'El servicio o la base de datos no están disponibles'
            : exception.message,
        details: r,
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      error: 'INTERNAL_ERROR',
      message: 'Ocurrió un error inesperado',
    };
  }
}
