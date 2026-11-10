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
  /**
   * Misma regla y puntaje que la consulta SQL de PrismaLibroRepository.buscar.
   * Sin tildes ni mayúsculas (como f_unaccent + lower). La tolerancia a errores de
   * pg_trgm se aproxima así: una palabra de 4 o más letras coincide con otra que esté
   * a un cambio de distancia (vale 0,75 de una coincidencia exacta).
   */
  buscar(c: ConsultaBusqueda): Promise<{ items: Libro[]; total: number }> {
    const terminos = [...new Set(c.terminos.map(normalizar))];
    const frase = normalizar(c.frase);
    const puntuados = [...this.filas.values()]
      .map((l) => {
        const titulo = normalizar(l.titulo);
        const autores = l.autores.map((a) => normalizar(a.nombre));
        const temas = l.temas.map((t) => normalizar(t.nombre));
        let puntos = 0;
        for (const t of terminos) {
          const enTitulo = parecido(t, titulo) * 3;
          const enAutores = autores.reduce((s, a) => s + parecido(t, a) * 2, 0);
          const enTemas = temas.reduce((s, te) => s + parecido(t, te), 0);
          if (enTitulo + enAutores + enTemas === 0) return null;
          puntos += enTitulo + enAutores + enTemas;
        }
        puntos +=
          (titulo.includes(frase) ? 5 : 0) + (titulo.startsWith(frase) ? 3 : 0);
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

/** Minúsculas y sin tildes, como f_unaccent(lower(...)) en PostgreSQL. */
function normalizar(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

/** 1 si el término aparece tal cual; 0,75 si alguna palabra está a un cambio (≥ 4 letras); si no, 0. */
function parecido(termino: string, texto: string): number {
  if (texto.includes(termino)) return 1;
  if (termino.length < 4) return 0;
  return texto.split(/[^a-z0-9ñ]+/).some((p) => aUnCambio(termino, p))
    ? 0.75
    : 0;
}

/** Distancia de edición ≤ 1 (cambiar, quitar o agregar una letra). */
function aUnCambio(a: string, b: string): boolean {
  if (Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  let j = 0;
  let cambios = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      i++;
      j++;
      continue;
    }
    if (++cambios > 1) return false;
    if (a.length > b.length) i++;
    else if (b.length > a.length) j++;
    else {
      i++;
      j++;
    }
  }
  return cambios + (a.length - i) + (b.length - j) <= 1;
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
