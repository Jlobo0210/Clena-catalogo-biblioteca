import {
  ConflictError,
  ValidationError,
} from '../../../../shared/domain/domain-error';
import { UbicacionesEnMemoria } from '../../../../../test/fakes/ubicaciones.fakes';
import { describirLugar, validarLugar } from '../../domain/entities/ubicacion';
import {
  CrearUbicacionUseCase,
  ListarUbicacionesUseCase,
} from './ubicaciones.use-cases';

describe('Ubicaciones (HU-25)', () => {
  it('lista ordenado por sala, sección y estante', async () => {
    const repo = new UbicacionesEnMemoria()
      .con({ sala: 'Sala 2', seccion: 'Arte', estante: 'A-01' })
      .con({ sala: 'Sala 1', seccion: 'Historia', estante: 'H-02' })
      .con({ sala: 'Sala 1', seccion: 'Historia', estante: 'H-01' });

    const lista = await new ListarUbicacionesUseCase(repo).execute();
    expect(lista.map(describirLugar)).toEqual([
      'Sala 1 · Sección Historia · Estante H-01',
      'Sala 1 · Sección Historia · Estante H-02',
      'Sala 2 · Sección Arte · Estante A-01',
    ]);
  });

  it('crea una ubicación con los textos normalizados', async () => {
    const repo = new UbicacionesEnMemoria();
    const creada = await new CrearUbicacionUseCase(repo).execute({
      sala: '  Sala   3 ',
      seccion: 'Referencia',
      estante: ' R-01',
    });
    expect(creada).toMatchObject({
      sala: 'Sala 3',
      seccion: 'Referencia',
      estante: 'R-01',
    });
    expect(creada.codigo).toBeTruthy();
    expect(repo.filas).toHaveLength(1);
  });

  it('no permite repetir sala, sección y estante', async () => {
    const repo = new UbicacionesEnMemoria().con({
      sala: 'Sala 1',
      seccion: 'Historia',
      estante: 'H-01',
    });
    await expect(
      new CrearUbicacionUseCase(repo).execute({
        sala: 'Sala 1',
        seccion: ' Historia ',
        estante: 'H-01',
      }),
    ).rejects.toThrow(
      new ConflictError(
        'La ubicación «Sala 1 · Sección Historia · Estante H-01» ya existe',
      ),
    );
  });

  it.each([
    [{ sala: '', seccion: 'X', estante: 'Y' }, 'Indica la sala'],
    [{ sala: 'X', seccion: '  ', estante: 'Y' }, 'Indica la sección'],
    [{ sala: 'X', seccion: 'Y', estante: '' }, 'Indica el estante'],
    [
      { sala: 'x'.repeat(61), seccion: 'Y', estante: 'Z' },
      'El nombre de la sala no puede superar 60 caracteres',
    ],
    [
      { sala: 'X', seccion: 'Y', estante: 'z'.repeat(31) },
      'El nombre de el estante no puede superar 30 caracteres',
    ],
  ])('valida el lugar %j', (lugar, mensaje) => {
    expect(() => validarLugar(lugar)).toThrow(new ValidationError(mensaje));
  });
});
