import {
  DomainError,
  ValidationError,
} from '../../../../shared/domain/domain-error';
import { Autor } from '../../domain/entities/autor';
import { Ejemplar } from '../../domain/entities/ejemplar';
import { Libro } from '../../domain/entities/libro';
import { Tema } from '../../domain/entities/tema';
import {
  FilaCatalogo,
  ImportadorCatalogo,
} from '../../domain/repositories/importador-catalogo';
import { FilaCsv, LectorCsv } from '../../domain/services/lector-csv';
import { EstadoEjemplar } from '../../domain/value-objects/estado-ejemplar';
import { Formato } from '../../domain/value-objects/formato';
import { TipoMaterial } from '../../domain/value-objects/tipo-material';
import { ErrorFila, ReporteImportacion } from '../dtos/importacion.dto';

/** Columnas de la plantilla, en orden. Las tres primeras son obligatorias. */
export const COLUMNAS_CATALOGO = [
  'titulo',
  'autores',
  'idioma',
  'temas',
  'anio_publicacion',
  'isbn',
  'tipo_material',
  'formato',
  'enlace_digital',
  'codigo_inventario',
  'sala',
  'seccion',
  'estante',
  'estado',
] as const;
export const COLUMNAS_OBLIGATORIAS = ['titulo', 'autores', 'idioma'];
// Cada fila se guarda en su propia transacción: unas 30 filas por segundo.
// Con 1000 filas la petición dura menos de 60 s (el límite habitual de un proxy como nginx).
export const MAX_FILAS = 1000;
/** Separador de varios autores o temas dentro de una celda. */
export const SEPARADOR_LISTA = '|';

const SALA_MAX = 60;
const SECCION_MAX = 60;
const ESTANTE_MAX = 30;

/** Plantilla descargable: cabecera y dos filas de ejemplo (un libro físico con ejemplar y uno digital). */
export function plantillaCsv(): string {
  const filas = [
    COLUMNAS_CATALOGO.join(','),
    'Manual de catalogación,María Ejemplo,es,Bibliotecología|Literatura,2020,978-0-306-40615-7,LIBRO,FISICO,,INV-EJEMPLO-1,Sala 1,Humanidades,E-01,DISPONIBLE',
    'Revista de redes,Ana Pérez|Luis Gómez,es,Redes,2024,,REVISTA,DIGITAL,https://biblioteca.example/revista-redes,,,,,',
  ];
  return filas.join('\r\n') + '\r\n';
}

/**
 * HU-19: el personal carga libros y ejemplares desde un CSV.
 * Cada fila se valida con las mismas reglas de las entidades y se guarda por separado:
 * las filas válidas se importan y las demás se informan con su número de línea.
 */
export class ImportarCatalogoUseCase {
  constructor(
    private readonly lector: LectorCsv,
    private readonly importador: ImportadorCatalogo,
  ) {}

  async execute(contenido: string): Promise<ReporteImportacion> {
    const { columnas, filas } = this.lector.leer(contenido);
    const faltantes = COLUMNAS_OBLIGATORIAS.filter(
      (c) => !columnas.includes(c),
    );
    if (faltantes.length > 0) {
      throw new ValidationError(
        `Faltan columnas obligatorias: ${faltantes.join(', ')}. Descarga la plantilla para ver el formato.`,
      );
    }
    if (filas.length === 0) {
      throw new ValidationError('El archivo no tiene filas con datos');
    }
    if (filas.length > MAX_FILAS) {
      throw new ValidationError(
        `El archivo tiene ${filas.length} filas; el máximo por importación es ${MAX_FILAS}`,
      );
    }

    const reporte: ReporteImportacion = {
      totalFilas: filas.length,
      columnasIgnoradas: columnas.filter(
        (c) => !(COLUMNAS_CATALOGO as readonly string[]).includes(c),
      ),
      filasImportadas: 0,
      filasConError: 0,
      librosCreados: 0,
      librosExistentes: 0,
      ejemplaresCreados: 0,
      ejemplaresExistentes: 0,
      autoresCreados: 0,
      temasCreados: 0,
      ubicacionesCreadas: 0,
      errores: [],
    };

    // En orden: así una fila puede reutilizar el libro creado por una fila anterior.
    for (const fila of filas) {
      const { datos, errores } = validarFila(fila);
      if (!datos) {
        this.registrarError(reporte, { fila: fila.linea, errores });
        continue;
      }
      try {
        const r = await this.importador.importarFila(datos);
        reporte.filasImportadas++;
        if (r.libro === 'creado') reporte.librosCreados++;
        else reporte.librosExistentes++;
        if (r.ejemplar === 'creado') reporte.ejemplaresCreados++;
        if (r.ejemplar === 'existente') reporte.ejemplaresExistentes++;
        reporte.autoresCreados += r.autoresCreados;
        reporte.temasCreados += r.temasCreados;
        if (r.ubicacionCreada) reporte.ubicacionesCreadas++;
      } catch (error) {
        // Un error de reglas (p. ej. código de inventario de otro libro) solo afecta a su fila.
        if (!(error instanceof DomainError)) throw error;
        this.registrarError(reporte, {
          fila: fila.linea,
          errores: [error.message],
        });
      }
    }
    return reporte;
  }

  private registrarError(reporte: ReporteImportacion, error: ErrorFila): void {
    reporte.filasConError++;
    reporte.errores.push(error);
  }
}

/** Valida una fila con las reglas de las entidades y junta todos sus errores. */
function validarFila(fila: FilaCsv): {
  datos: FilaCatalogo | null;
  errores: string[];
} {
  const v = (columna: string) => (fila.valores[columna] ?? '').trim();
  const errores: string[] = [];
  const intentar = <T>(fn: () => T): T | undefined => {
    try {
      return fn();
    } catch (error) {
      if (!(error instanceof DomainError)) throw error;
      errores.push(error.message);
      return undefined;
    }
  };

  const autores = intentar(() => {
    const nombres = lista(v('autores'));
    if (nombres.length === 0) {
      throw new ValidationError('Un libro debe tener al menos un autor');
    }
    return nombres.map((n) => Autor.crear('validacion', n).nombre);
  });
  const temas = intentar(() =>
    lista(v('temas')).map((n) => Tema.crear('validacion', n).nombre),
  );
  const anio = intentar(() => entero(v('anio_publicacion')));
  const tipoMaterial = intentar(() =>
    enumerado<TipoMaterial>(v('tipo_material'), 'tipo_material'),
  );
  const formato = intentar(() => enumerado<Formato>(v('formato'), 'formato'));

  // El libro se valida con la entidad; los autores se pasan como referencias provisionales.
  const libro =
    autores &&
    temas &&
    anio !== undefined &&
    tipoMaterial !== undefined &&
    formato !== undefined
      ? intentar(() =>
          Libro.crear('validacion', {
            titulo: v('titulo'),
            idioma: v('idioma'),
            anioPublicacion: anio,
            isbn: v('isbn') || null,
            tipoMaterial: tipoMaterial ?? undefined,
            formato: formato ?? undefined,
            enlaceDigital: v('enlace_digital') || null,
            autores: autores.map((nombre) => ({ id: nombre, nombre })),
          }),
        )
      : undefined;

  const ejemplar = intentar(() => {
    const codigo = v('codigo_inventario');
    const ubicacion = [v('sala'), v('seccion'), v('estante')];
    if (!codigo) {
      if (ubicacion.some(Boolean) || v('estado')) {
        throw new ValidationError(
          'Para registrar un ejemplar indica su codigo_inventario',
        );
      }
      return null;
    }
    if (libro && !libro.admiteEjemplares) {
      throw new ValidationError(
        'Un libro solo digital no tiene ejemplares: deja vacío codigo_inventario',
      );
    }
    const [sala, seccion, estante] = [
      texto(ubicacion[0], 'sala', SALA_MAX),
      texto(ubicacion[1], 'seccion', SECCION_MAX),
      texto(ubicacion[2], 'estante', ESTANTE_MAX),
    ];
    const estado =
      enumerado<EstadoEjemplar>(v('estado'), 'estado') ?? 'DISPONIBLE';
    if (estado === 'PRESTADO') {
      throw new ValidationError(
        'Un ejemplar importado no puede quedar PRESTADO: los préstamos se registran en el sistema',
      );
    }
    const validado = Ejemplar.crear(
      'validacion',
      {
        libroId: 'validacion',
        ubicacionId: 'validacion',
        codigoInventario: codigo,
        estado,
      },
      { id: 'validacion', sala, seccion, estante, codigo: 'validacion' },
    );
    return {
      codigoInventario: validado.codigoInventario,
      estado: validado.estado,
      sala,
      seccion,
      estante,
    };
  });

  if (
    errores.length > 0 ||
    !libro ||
    !autores ||
    !temas ||
    ejemplar === undefined
  ) {
    return { datos: null, errores };
  }
  return {
    datos: {
      libro: {
        titulo: libro.titulo,
        anioPublicacion: libro.anioPublicacion,
        idioma: libro.idioma,
        isbn: libro.isbn?.valor ?? null,
        tipoMaterial: libro.tipoMaterial,
        formato: libro.formato,
        enlaceDigital: libro.enlaceDigital,
      },
      autores: libro.autores.map((a) => a.nombre),
      temas,
      ejemplar,
    },
    errores,
  };
}

/**
 * «Ana Pérez | Luis Gómez» → ['Ana Pérez', 'Luis Gómez'].
 * Quita los repetidos sin distinguir mayúsculas (se queda con el primero),
 * porque el importador también busca autores y temas así.
 */
function lista(valor: string): string[] {
  const vistos = new Set<string>();
  return valor
    .split(SEPARADOR_LISTA)
    .map((s) => s.trim().replace(/\s+/g, ' '))
    .filter((s) => {
      const clave = s.toLowerCase();
      if (!s || vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    });
}

function entero(valor: string): number | null {
  if (!valor) return null;
  if (!/^\d{1,4}$/.test(valor)) {
    throw new ValidationError(
      `anio_publicacion debe ser un año (número entero); llegó «${valor}»`,
    );
  }
  return Number(valor);
}

/**
 * Acepta el valor como lo escribiría una persona: «Físico y digital» → FISICO_Y_DIGITAL.
 * Vacío → null (se usa el valor por defecto). La validación final la hacen las entidades.
 */
function enumerado<T extends string>(valor: string, columna: string): T | null {
  if (!valor) return null;
  const normalizado = valor
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
  if (!/^[A-Z_]+$/.test(normalizado)) {
    throw new ValidationError(`${columna} no es válido: «${valor}»`);
  }
  return normalizado as T;
}

function texto(valor: string, columna: string, max: number): string {
  const limpio = valor.replace(/\s+/g, ' ').trim();
  if (!limpio) {
    throw new ValidationError(
      `Para registrar un ejemplar indica su ${columna}`,
    );
  }
  if (limpio.length > max) {
    throw new ValidationError(`${columna} no puede superar ${max} caracteres`);
  }
  return limpio;
}
