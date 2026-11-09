/** Implementaciones en memoria de los puertos del catálogo, para pruebas unitarias y e2e (sin base de datos). */
import { Autor } from '../../src/modules/catalogo/domain/entities/autor';
import {
  AutorRepository,
  FiltroAutores,
} from '../../src/modules/catalogo/domain/repositories/autor.repository';
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

export class AutoresEnMemoria implements AutorRepository {
  readonly filas = new Map<string, Autor>();
  /** Libros asociados por autor (los gestiona HU-16; aquí solo se cuentan). */
  readonly libros = new Map<string, number>();

  conLibros(autorId: string, cantidad: number): this {
    this.libros.set(autorId, cantidad);
    return this;
  }

  guardar(autor: Autor): Promise<void> {
    this.filas.set(autor.id, autor);
    return Promise.resolve();
  }
  buscarPorId(id: string): Promise<Autor | null> {
    return Promise.resolve(this.filas.get(id) ?? null);
  }
  listar(f: FiltroAutores): Promise<{ items: Autor[]; total: number }> {
    const signo = f.direccion === 'asc' ? 1 : -1;
    const todos = [...this.filas.values()]
      .filter(
        (a) =>
          !f.nombre || a.nombre.toLowerCase().includes(f.nombre.toLowerCase()),
      )
      .sort((a, b) => {
        const comparacion =
          f.ordenarPor === 'nombre'
            ? a.nombre.localeCompare(b.nombre, 'es')
            : a.creadoEn.getTime() - b.creadoEn.getTime();
        return comparacion === 0
          ? a.id.localeCompare(b.id)
          : comparacion * signo;
      });
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
  contarLibros(autorId: string): Promise<number> {
    return Promise.resolve(this.libros.get(autorId) ?? 0);
  }
}
