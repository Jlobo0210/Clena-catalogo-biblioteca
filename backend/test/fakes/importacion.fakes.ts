/** Importador en memoria con las mismas reglas que PrismaImportadorCatalogo, para pruebas sin base de datos. */
import {
  FilaCatalogo,
  ImportadorCatalogo,
  ResultadoFila,
} from '../../src/modules/catalogo/domain/repositories/importador-catalogo';
import { ConflictError } from '../../src/shared/domain/domain-error';

interface LibroGuardado {
  clave: string;
  fila: FilaCatalogo;
}

export class ImportadorEnMemoria implements ImportadorCatalogo {
  readonly autores = new Set<string>();
  readonly temas = new Set<string>();
  readonly ubicaciones = new Set<string>();
  readonly libros: LibroGuardado[] = [];
  /** Código de inventario → clave del libro. */
  readonly ejemplares = new Map<string, string>();

  importarFila(fila: FilaCatalogo): Promise<ResultadoFila> {
    const nuevos = (nombres: string[], conjunto: Set<string>) =>
      nombres.filter((n) => {
        const clave = n.toLowerCase();
        if (conjunto.has(clave)) return false;
        conjunto.add(clave);
        return true;
      }).length;
    const autoresCreados = nuevos(fila.autores, this.autores);
    const temasCreados = nuevos(fila.temas, this.temas);

    const clave =
      fila.libro.isbn ??
      `${fila.libro.titulo.toLowerCase()}|${[...fila.autores]
        .map((a) => a.toLowerCase())
        .sort()
        .join()}`;
    let libro = this.libros.find((l) => l.clave === clave);
    const existia = libro !== undefined;
    if (!libro) {
      libro = { clave, fila };
      this.libros.push(libro);
    }

    let ejemplar: ResultadoFila['ejemplar'] = null;
    let ubicacionCreada = false;
    if (fila.ejemplar) {
      if (libro.fila.libro.formato === 'DIGITAL') {
        return Promise.reject(
          new ConflictError('El libro es solo digital: no admite ejemplares'),
        );
      }
      const dueno = this.ejemplares.get(fila.ejemplar.codigoInventario);
      if (dueno && dueno !== clave) {
        return Promise.reject(
          new ConflictError(
            `El código de inventario ${fila.ejemplar.codigoInventario} ya pertenece a otro libro`,
          ),
        );
      }
      if (dueno) {
        ejemplar = 'existente';
      } else {
        const ubicacion = [
          fila.ejemplar.sala,
          fila.ejemplar.seccion,
          fila.ejemplar.estante,
        ].join('|');
        ubicacionCreada = !this.ubicaciones.has(ubicacion);
        this.ubicaciones.add(ubicacion);
        this.ejemplares.set(fila.ejemplar.codigoInventario, clave);
        ejemplar = 'creado';
      }
    }
    return Promise.resolve({
      libro: existia ? 'existente' : 'creado',
      ejemplar,
      autoresCreados,
      temasCreados,
      ubicacionCreada,
    });
  }
}
