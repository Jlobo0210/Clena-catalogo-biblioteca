import {
  ArgumentsHost,
  BadRequestException,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../domain/domain-error';
import { AllExceptionsFilter } from './all-exceptions.filter';

interface FakeResponse {
  statusCode: number;
  body: unknown;
  status(code: number): FakeResponse;
  json(body: unknown): FakeResponse;
}

function fakeHost(req: Record<string, unknown>) {
  const res: FakeResponse = {
    statusCode: 0,
    body: undefined,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(b) {
      res.body = b;
      return res;
    },
  };
  const host = {
    switchToHttp: () => ({ getRequest: () => req, getResponse: () => res }),
  } as unknown as ArgumentsHost;
  return { host, res };
}

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  it.each([
    [new ValidationError('nombre inválido'), 400, 'VALIDATION_ERROR'],
    [new NotFoundError('no existe'), 404, 'NOT_FOUND'],
    [new ConflictError('repetido'), 409, 'CONFLICT'],
  ])('traduce errores de dominio (%p)', (err, status, code) => {
    expect(filter.toBody(err)).toEqual({
      statusCode: status,
      error: code,
      message: err.message,
    });
  });

  it('agrupa los errores de ValidationPipe en details', () => {
    const body = filter.toBody(
      new BadRequestException(['nombre should not be empty']),
    );
    expect(body).toEqual({
      statusCode: 400,
      error: 'VALIDATION_ERROR',
      message: 'Los datos enviados no son válidos',
      details: ['nombre should not be empty'],
    });
  });

  it('respeta el estado de una HttpException', () => {
    expect(filter.toBody(new NotFoundException('Libro no encontrado'))).toEqual(
      { statusCode: 404, error: 'NOT_FOUND', message: 'Libro no encontrado' },
    );
  });

  it('conserva respuestas con estructura propia como details', () => {
    const body = filter.toBody(
      new ServiceUnavailableException({ status: 'error', error: { db: {} } }),
    );
    expect(body.statusCode).toBe(503);
    expect(body.error).toBe('SERVICE_UNAVAILABLE');
    expect(body.details).toEqual({ status: 'error', error: { db: {} } });
  });

  it('oculta los detalles de errores inesperados', () => {
    jest.spyOn(filter['logger'], 'error').mockImplementation(() => undefined);
    const { host, res } = fakeHost({ url: '/api/v1/x', id: 'req-1' });

    filter.catch(new Error('password=1234 en la cadena de conexión'), host);

    expect(res.statusCode).toBe(500);
    expect(res.body).toMatchObject({
      statusCode: 500,
      error: 'INTERNAL_ERROR',
      message: 'Ocurrió un error inesperado',
      path: '/api/v1/x',
      requestId: 'req-1',
    });
    expect(JSON.stringify(res.body)).not.toContain('password');
  });
});
