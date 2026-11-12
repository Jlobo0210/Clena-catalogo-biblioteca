/** Repositorio de ubicaciones en memoria, para pruebas unitarias y e2e (sin base de datos). */
import { UbicacionProps } from '../../src/modules/catalogo/domain/entities/ejemplar';
import { Lugar } from '../../src/modules/catalogo/domain/entities/ubicacion';
import { UbicacionRepository } from '../../src/modules/catalogo/domain/repositories/ubicacion.repository';

export class UbicacionesEnMemoria implements UbicacionRepository {
  readonly filas: UbicacionProps[] = [];
  private n = 0;

  con(lugar: Lugar): this {
    this.filas.push({ id: `u-${++this.n}`, codigo: `COD-${this.n}`, ...lugar });
    return this;
  }

  listar(): Promise<UbicacionProps[]> {
    const clave = (u: UbicacionProps) => `${u.sala}|${u.seccion}|${u.estante}`;
    return Promise.resolve(
      [...this.filas].sort((a, b) => clave(a).localeCompare(clave(b), 'es')),
    );
  }

  buscarPorLugar(lugar: Lugar): Promise<UbicacionProps | null> {
    return Promise.resolve(
      this.filas.find(
        (u) =>
          u.sala === lugar.sala &&
          u.seccion === lugar.seccion &&
          u.estante === lugar.estante,
      ) ?? null,
    );
  }

  crear(lugar: Lugar): Promise<UbicacionProps> {
    this.con(lugar);
    return Promise.resolve(this.filas[this.filas.length - 1]);
  }
}
