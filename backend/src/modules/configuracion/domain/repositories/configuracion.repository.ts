export interface ConfiguracionBiblioteca {
  horarios: string;
  telefono: string;
  correo: string;
}

export const CONFIGURACION_REPOSITORY = Symbol('CONFIGURACION_REPOSITORY');

export interface ConfiguracionRepository {
  obtener(): Promise<ConfiguracionBiblioteca | null>;
  guardar(datos: ConfiguracionBiblioteca): Promise<ConfiguracionBiblioteca>;
}
