/** Implementaciones en memoria de los puertos del catálogo, para pruebas unitarias y e2e (sin base de datos). */
import { Autor } from '../../src/modules/catalogo/domain/entities/autor';
import {
  AutorRepository,
  FiltroAutores,
} from '../../src/modules/catalogo/domain/repositories/autor.repository';
import { Tema } from '../../src/modules/catalogo/domain/entities/tema';
import {
  FiltroTemas,
  TemaRepository,
} from '../../src/modules/catalogo/domain/repositories/tema.repository';
import {
  Libro,
  Referencia,
} from '../../src/modules/catalogo/domain/entities/libro';
import {
  ConsultaBusqueda,
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
  /** Misma regla y puntaje que la consulta SQL de PrismaLibroRepository.buscar. */
  buscar(c: ConsultaBusqueda): Promise<{ items: Libro[]; total: number }> {
    const puntuados = [...this.filas.values()]
      .map((l) => {
        const titulo = l.titulo.toLowerCase();
        const autores = l.autores.map((a) => a.nombre.toLowerCase()).join(' ');
        const temas = l.temas.map((t) => t.nombre.toLowerCase()).join(' ');
        const todo = `${titulo} ${autores} ${temas}`;
        if (!c.terminos.every((t) => todo.includes(t))) return null;
        const puntos =
          c.terminos.reduce(
            (s, t) =>
              s +
              (titulo.includes(t) ? 3 : 0) +
              (autores.includes(t) ? 2 : 0) +
              (temas.includes(t) ? 1 : 0),
            0,
          ) +
          (titulo.includes(c.frase) ? 5 : 0) +
          (titulo.startsWith(c.frase) ? 3 : 0);
        return { l, puntos };
      })
      .filter((x): x is { l: Libro; puntos: number } => x !== null)
      .sort(
        (a, b) =>
          b.puntos - a.puntos || a.l.titulo.localeCompare(b.l.titulo, 'es'),
      );
    const inicio = (c.pagina - 1) * c.tamano;
    return Promise.resolve({
      items: puntuados.slice(inicio, inicio + c.tamano).map((x) => x.l),
      total: puntuados.length,
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

export class TemasEnMemoria implements TemaRepository {
  readonly filas = new Map<string, Tema>();
  /** Libros clasificados por tema (los gestiona HU-16; aquí solo se cuentan). */
  readonly libros = new Map<string, number>();

  conLibros(temaId: string, cantidad: number): this {
    this.libros.set(temaId, cantidad);
    return this;
  }

  guardar(tema: Tema): Promise<void> {
    this.filas.set(tema.id, tema);
    return Promise.resolve();
  }
  buscarPorId(id: string): Promise<Tema | null> {
    return Promise.resolve(this.filas.get(id) ?? null);
  }
  buscarPorNombre(nombre: string): Promise<Tema | null> {
    const buscado = nombre.toLowerCase();
    return Promise.resolve(
      [...this.filas.values()].find(
        (t) => t.nombre.toLowerCase() === buscado,
      ) ?? null,
    );
  }
  listar(f: FiltroTemas): Promise<{ items: Tema[]; total: number }> {
    const signo = f.direccion === 'asc' ? 1 : -1;
    const todos = [...this.filas.values()]
      .filter(
        (t) =>
          !f.nombre || t.nombre.toLowerCase().includes(f.nombre.toLowerCase()),
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
  contarLibros(temaId: string): Promise<number> {
    return Promise.resolve(this.libros.get(temaId) ?? 0);
  }
  contarLibrosPorTema(temaIds: string[]): Promise<Map<string, number>> {
    return Promise.resolve(
      new Map(temaIds.map((id) => [id, this.libros.get(id) ?? 0])),
    );
  }
}
