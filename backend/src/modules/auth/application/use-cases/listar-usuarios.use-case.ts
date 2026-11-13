import { UsuarioRepository } from '../../domain/repositories/usuario.repository';
import { ListarUsuariosInput, Pagina, UsuarioOutput } from '../dtos/auth.dto';
import { aUsuarioOutput } from './usuario-output';

export const TAMANO_PAGINA_POR_DEFECTO = 20;
export const TAMANO_PAGINA_MAXIMO = 100;

/** HU-13: el administrador lista usuarios, paginado y con filtros por rol y texto. */
export class ListarUsuariosUseCase {
  constructor(private readonly usuarios: UsuarioRepository) {}

  async execute(
    input: ListarUsuariosInput = {},
  ): Promise<Pagina<UsuarioOutput>> {
    const pagina = Math.max(1, Math.floor(input.pagina ?? 1));
    const tamano = Math.min(
      TAMANO_PAGINA_MAXIMO,
      Math.max(1, Math.floor(input.tamano ?? TAMANO_PAGINA_POR_DEFECTO)),
    );
    const texto = input.texto?.trim() || undefined;
    const { items, total } = await this.usuarios.listar({
      pagina,
      tamano,
      rol: input.rol,
      texto,
    });
    return { items: items.map(aUsuarioOutput), total, pagina, tamano };
  }
}
