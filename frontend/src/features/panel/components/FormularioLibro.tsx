import { useId, useState, type FormEvent } from 'react';
import { Save } from 'lucide-react';
import { normalizarError } from '../../../api/errores';
import { useConsulta } from '../../../shared/hooks/useConsulta';
import { Boton } from '../../../shared/ui/Boton';
import { CampoTexto } from '../../auth/components/CampoTexto';
import { ResumenErrores } from '../../auth/components/ResumenErrores';
import { NOMBRE_FORMATO, NOMBRE_TIPO_MATERIAL, nombreIdioma } from '../../catalogo/etiquetas';
import type { FormatoMaterial, LibroDto, Referencia, TipoMaterial } from '../../catalogo/types';
import { listarTemasPaginados, type DatosLibro } from '../api/catalogo-admin.api';
import { SelectorAutores } from './SelectorAutores';
import estilos from './GestionCatalogo.module.css';
import styles from './LibroFormulario.module.css';

const IDIOMAS = ['es', 'en', 'fr', 'pt', 'it', 'de', 'la'];
const TITULO_MAX = 300;

interface Errores {
  titulo?: string;
  autores?: string;
  anio?: string;
  isbn?: string;
  enlace?: string;
}

interface FormularioLibroProps {
  /** Si llega, se edita ese libro; si no, se registra uno nuevo. */
  libro?: LibroDto;
  onGuardar: (datos: DatosLibro) => Promise<void>;
}

/** Datos del libro con validación antes de enviar; los errores del servidor se muestran arriba (HU-25). */
export function FormularioLibro({ libro, onGuardar }: FormularioLibroProps) {
  const id = useId();
  const [titulo, setTitulo] = useState(libro?.titulo ?? '');
  const [autores, setAutores] = useState<Referencia[]>(libro?.autores ?? []);
  const [temaIds, setTemaIds] = useState<string[]>(libro?.temas.map((t) => t.id) ?? []);
  const [anio, setAnio] = useState(libro?.anioPublicacion?.toString() ?? '');
  const [idioma, setIdioma] = useState(libro?.idioma ?? 'es');
  const [isbn, setIsbn] = useState(libro?.isbn ?? '');
  const [tipo, setTipo] = useState<TipoMaterial>(libro?.tipoMaterial ?? 'LIBRO');
  const [formato, setFormato] = useState<FormatoMaterial>(libro?.formato ?? 'FISICO');
  const [enlace, setEnlace] = useState(libro?.enlaceDigital ?? '');
  const [errores, setErrores] = useState<Errores>({});
  const [errorServidor, setErrorServidor] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const temas = useConsulta('temas-libro', (signal) =>
    listarTemasPaginados({ pagina: 1, tamano: 100, ordenarPor: 'nombre', direccion: 'asc' }, signal),
  );
  const idiomas = IDIOMAS.includes(idioma) ? IDIOMAS : [...IDIOMAS, idioma];
  const conEnlace = formato !== 'FISICO';

  const validar = (): Errores => {
    const e: Errores = {};
    const tituloLimpio = titulo.trim();
    if (!tituloLimpio) e.titulo = 'Escribe el título.';
    else if (tituloLimpio.length > TITULO_MAX) e.titulo = `El título no puede superar ${TITULO_MAX} caracteres.`;
    if (autores.length === 0) e.autores = 'Agrega al menos un autor.';
    const maximo = new Date().getFullYear() + 1;
    if (anio.trim() && (!/^\d{4}$/.test(anio.trim()) || Number(anio) < 1000 || Number(anio) > maximo)) {
      e.anio = `Escribe un año entre 1000 y ${maximo}, o déjalo vacío.`;
    }
    if (isbn.trim() && !/^(\d{9}[\dXx]|\d{13})$/.test(isbn.replace(/[\s-]/g, ''))) {
      e.isbn = 'El ISBN debe tener 10 o 13 dígitos (con o sin guiones).';
    }
    if (conEnlace && !/^https?:\/\/\S+$/i.test(enlace.trim())) {
      e.enlace = 'Un libro digital necesita su enlace, que empiece por http:// o https://.';
    }
    return e;
  };

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorServidor([]);
    const nuevos = validar();
    setErrores(nuevos);
    if (Object.keys(nuevos).length > 0) return;
    setEnviando(true);
    try {
      await onGuardar({
        titulo: titulo.trim(),
        anioPublicacion: anio.trim() ? Number(anio) : null,
        idioma,
        isbn: isbn.trim() || null,
        tipoMaterial: tipo,
        formato,
        enlaceDigital: conEnlace ? enlace.trim() : null,
        autorIds: autores.map((a) => a.id),
        temaIds,
      });
    } catch (error) {
      const e = normalizarError(error);
      setErrorServidor(e.detalles?.length ? e.detalles : [e.mensaje]);
    } finally {
      setEnviando(false);
    }
  };

  const mensajes = Object.values(errores).filter((m): m is string => Boolean(m));

  return (
    <form
      aria-labelledby={`${id}-titulo`}
      className={`${estilos.formulario} ${styles.libro}`}
      noValidate
      onSubmit={(e) => void enviar(e)}
    >
      <h2 id={`${id}-titulo`}>Datos del libro</h2>
      <ResumenErrores mensajes={errorServidor.length ? errorServidor : mensajes} titulo="Revisa estos datos" />

      <CampoTexto
        autoComplete="off"
        error={errores.titulo}
        etiqueta="Título"
        maxLength={TITULO_MAX}
        onChange={(e) => setTitulo(e.target.value)}
        required
        value={titulo}
      />

      <SelectorAutores error={errores.autores} onCambiar={setAutores} seleccionados={autores} />

      <div className={styles.fila}>
        <CampoTexto
          error={errores.anio}
          etiqueta="Año de publicación (opcional)"
          inputMode="numeric"
          maxLength={4}
          onChange={(e) => setAnio(e.target.value)}
          value={anio}
        />
        <div className={styles.campo}>
          <label htmlFor={`${id}-idioma`}>Idioma</label>
          <select className={styles.control} id={`${id}-idioma`} onChange={(e) => setIdioma(e.target.value)} value={idioma}>
            {idiomas.map((codigo) => (
              <option key={codigo} value={codigo}>
                {nombreIdioma(codigo)}
              </option>
            ))}
          </select>
        </div>
        <div className={styles.campo}>
          <label htmlFor={`${id}-tipo`}>Tipo de material</label>
          <select
            className={styles.control}
            id={`${id}-tipo`}
            onChange={(e) => setTipo(e.target.value as TipoMaterial)}
            value={tipo}
          >
            {(Object.keys(NOMBRE_TIPO_MATERIAL) as TipoMaterial[]).map((t) => (
              <option key={t} value={t}>
                {NOMBRE_TIPO_MATERIAL[t]}
              </option>
            ))}
          </select>
        </div>
      </div>

      <CampoTexto
        ayuda="Opcional. Con o sin guiones; no puede repetirse en otro libro."
        error={errores.isbn}
        etiqueta="ISBN"
        maxLength={20}
        onChange={(e) => setIsbn(e.target.value)}
        value={isbn}
      />

      <fieldset className={styles.grupo}>
        <legend>Formato</legend>
        <div className={styles.opciones}>
          {(Object.keys(NOMBRE_FORMATO) as FormatoMaterial[]).map((f) => (
            <label key={f}>
              <input checked={formato === f} name={`${id}-formato`} onChange={() => setFormato(f)} type="radio" value={f} />
              {NOMBRE_FORMATO[f]}
            </label>
          ))}
        </div>
        {libro && libro.formato !== 'DIGITAL' && formato === 'DIGITAL' ? (
          <p className={styles.ayuda}>Un libro solo digital no puede tener ejemplares: si tiene, primero dalos de baja.</p>
        ) : null}
      </fieldset>

      {conEnlace ? (
        <CampoTexto
          error={errores.enlace}
          etiqueta="Enlace a la versión digital"
          inputMode="url"
          maxLength={500}
          onChange={(e) => setEnlace(e.target.value)}
          placeholder="https://"
          required
          type="url"
          value={enlace}
        />
      ) : null}

      <fieldset className={styles.grupo}>
        <legend>Temas (opcional)</legend>
        {temas.estado === 'cargando' ? (
          <p>Cargando temas…</p>
        ) : temas.estado === 'error' ? (
          <p className={styles.error}>No se pudieron cargar los temas: {temas.error.mensaje}</p>
        ) : temas.datos.items.length === 0 ? (
          <p className={styles.vacio}>No hay temas. Créalos en la sección Temas del panel.</p>
        ) : (
          <div className={styles.casillas}>
            {temas.datos.items.map((tema) => (
              <label key={tema.id}>
                <input
                  checked={temaIds.includes(tema.id)}
                  onChange={(e) =>
                    setTemaIds((actual) =>
                      e.target.checked ? [...actual, tema.id] : actual.filter((t) => t !== tema.id),
                    )
                  }
                  type="checkbox"
                />
                {tema.nombre}
              </label>
            ))}
          </div>
        )}
      </fieldset>

      <div className={estilos.acciones}>
        <Boton disabled={enviando} icono={Save} type="submit">
          {enviando ? 'Guardando…' : libro ? 'Guardar cambios' : 'Registrar libro'}
        </Boton>
      </div>
    </form>
  );
}
