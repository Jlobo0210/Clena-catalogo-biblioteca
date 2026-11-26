import type {
  ConfiguracionBiblioteca,
  ConfiguracionRepository,
} from '../../domain/repositories/configuracion.repository';

export class ConfiguracionUseCases {
  constructor(private readonly repositorio: ConfiguracionRepository) {}

  obtener() {
    return this.repositorio.obtener();
  }

  guardar(datos: ConfiguracionBiblioteca) {
    return this.repositorio.guardar(datos);
  }
}
