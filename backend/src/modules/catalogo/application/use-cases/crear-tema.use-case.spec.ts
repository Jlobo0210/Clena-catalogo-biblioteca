import { ConflictError } from '../../../../shared/domain/domain-error';
import { IdGenerator } from '../../../../shared/domain/id-generator';
import { Tema } from '../../domain/entities/tema';
import { TemaRepository } from '../../domain/repositories/tema.repository';
import { CrearTemaUseCase } from './crear-tema.use-case';

/** Repositorio falso en memoria: el caso de uso se prueba sin base de datos ni NestJS. */
class TemaRepositoryEnMemoria implements TemaRepository {
  readonly temas: Tema[] = [];

  guardar(tema: Tema): Promise<void> {
    this.temas.push(tema);
    return Promise.resolve();
  }

  buscarPorId(id: string): Promise<Tema | null> {
    return Promise.resolve(this.temas.find((t) => t.id === id) ?? null);
  }

  buscarPorNombre(nombre: string): Promise<Tema | null> {
    const buscado = nombre.toLowerCase();
    return Promise.resolve(
      this.temas.find((t) => t.nombre.toLowerCase() === buscado) ?? null,
    );
  }
}

const idsFijos: IdGenerator = { generate: () => 'tema-1' };

describe('CrearTemaUseCase', () => {
  it('guarda el tema y devuelve un DTO plano', async () => {
    const repo = new TemaRepositoryEnMemoria();
    const useCase = new CrearTemaUseCase(repo, idsFijos);

    const out = await useCase.execute({ nombre: ' Literatura ' });

    expect(out.id).toBe('tema-1');
    expect(out.nombre).toBe('Literatura');
    expect(Number.isNaN(Date.parse(out.creadoEn))).toBe(false);
    expect(repo.temas).toHaveLength(1);
  });

  it('no permite temas repetidos (sin importar mayúsculas)', async () => {
    const repo = new TemaRepositoryEnMemoria();
    await repo.guardar(Tema.crear('otro', 'Literatura'));
    const useCase = new CrearTemaUseCase(repo, idsFijos);

    await expect(useCase.execute({ nombre: 'literatura' })).rejects.toThrow(
      ConflictError,
    );
    expect(repo.temas).toHaveLength(1);
  });
});
