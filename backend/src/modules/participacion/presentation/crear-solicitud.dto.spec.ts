import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CrearSolicitudDto } from './crear-solicitud.dto';

describe('CrearSolicitudDto', () => {
  it('exige título y autor para libros', async () => {
    const dto = plainToInstance(CrearSolicitudDto, {
      tipo: 'LIBRO',
      titulo: '  ',
    });
    const errores = await validate(dto);
    expect(errores.map((error) => error.property)).toEqual(
      expect.arrayContaining(['titulo', 'autor']),
    );
  });

  it('exige mensaje para buzón y valida correo', async () => {
    const dto = plainToInstance(CrearSolicitudDto, {
      tipo: 'QUEJA',
      mensaje: ' ',
      correo: 'incorrecto',
    });
    const errores = await validate(dto);
    expect(errores.map((error) => error.property)).toEqual(
      expect.arrayContaining(['mensaje', 'correo']),
    );
  });

  it('normaliza texto y acepta datos válidos', async () => {
    const dto = plainToInstance(CrearSolicitudDto, {
      tipo: 'LIBRO',
      titulo: '  Obra  ',
      autor: '  Autor  ',
    });
    expect(await validate(dto)).toHaveLength(0);
    expect(dto.titulo).toBe('Obra');
    expect(dto.autor).toBe('Autor');
  });
});
