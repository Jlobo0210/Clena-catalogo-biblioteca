/** Implementaciones en memoria de los puertos del catálogo, para pruebas unitarias y e2e (sin base de datos). */
import {
  Libro,
  Referencia,
} from '../../src/modules/catalogo/domain/entities/libro';
import {
  FiltroLibros,
  LibroRepository,
} from '../../src/modules/catalogo/domain/repositories/libro.repository';

export class LibrosEnMemoria implements LibroRepository {
  readonly filas = new Map<string, Libro>();
  readonly autores = new Map<string, Referencia>();
  readonly temas = new Map<string, Referencia>();
  /** Ejemplares por libro (los gestiona HU-17; aquí solo se cuentan). */
  readonly ejemplares = new Map<string, number>();

  conAutor(id: string, nombre: string): this {
    this.autores.set(id, { id, nombre });
    return this;
  }
  conTema(id: string, nombre: string): this {
    this.temas.set(id, { id, nombre });
    return this;
  }

  guardar(libro: Libro): Promise<void> {
    this.filas.set(libro.id, libro);
    return Promise.resolve();
  }
  buscarPorId(id: string): Promise<Libro | null> {
    return Promise.resolve(this.filas.get(id) ?? null);
  }
  buscarPorIsbn(isbn: string): Promise<Libro | null> {
    return Promise.resolve(
      [...this.filas.values()].find((l) => l.isbn?.valor === isbn) ?? null,
    );
  }
  listar(f: FiltroLibros): Promise<{ items: Libro[]; total: number }> {
    const valor = (l: Libro): string | number =>
      f.ordenarPor === 'titulo'
        ? l.titulo
        : f.ordenarPor === 'anio'
          ? (l.anioPublicacion ?? Number.MAX_SAFE_INTEGER)
          : l.creadoEn.getTime();
    const signo = f.direccion === 'asc' ? 1 : -1;
    const todos = [...this.filas.values()]
      .filter(
        (l) =>
          (!f.texto ||
            l.titulo.toLowerCase().includes(f.texto.toLowerCase())) &&
          (!f.idioma || l.idioma === f.idioma) &&
          (!f.tipoMaterial || l.tipoMaterial === f.tipoMaterial) &&
          (!f.formato || l.formato === f.formato) &&
          (!f.autorId || l.autores.some((a) => a.id === f.autorId)) &&
          (!f.temaId || l.temas.some((t) => t.id === f.temaId)) &&
          (f.anioDesde === undefined ||
            (l.anioPublicacion ?? -Infinity) >= f.anioDesde) &&
          (f.anioHasta === undefined ||
            (l.anioPublicacion ?? Infinity) <= f.anioHasta),
      )
      .sort((a, b) => (valor(a) > valor(b) ? signo : -signo));
    const inicio = (f.pagina - 1) * f.tamano;
    return Promise.resolve({
      items: todos.slice(inicio, inicio + f.tamano),
      total: todos.length,
    });
  }
  eliminar(id: string): Promise<void> {
    this.filas.delete(id);
    return Promise.resolve();
  }
  contarEjemplares(libroId: string): Promise<number> {
    return Promise.resolve(this.ejemplares.get(libroId) ?? 0);
  }
  buscarAutores(ids: string[]): Promise<Referencia[]> {
    return Promise.resolve(
      ids.flatMap((id) =>
        this.autores.has(id) ? [this.autores.get(id)!] : [],
      ),
    );
  }
  buscarTemas(ids: string[]): Promise<Referencia[]> {
    return Promise.resolve(
      ids.flatMap((id) => (this.temas.has(id) ? [this.temas.get(id)!] : [])),
    );
  }
}
