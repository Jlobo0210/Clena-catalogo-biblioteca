import { useEffect, useId, useState } from 'react';
import { ArrowUp, Plus, UserPlus, X } from 'lucide-react';
import { normalizarError } from '../../../api/errores';
import { useConsulta } from '../../../shared/hooks/useConsulta';
import type { Referencia } from '../../catalogo/types';
import { crearAutor, listarAutores } from '../api/catalogo-admin.api';
import styles from './LibroFormulario.module.css';

interface SelectorAutoresProps {
  seleccionados: Referencia[];
  onCambiar: (autores: Referencia[]) => void;
  error?: string;
}

/**
 * Autores de un libro, en el orden en que aparecen en la portada (HU-25).
 * Busca en el servidor mientras se escribe (el catálogo puede tener cientos de autores)
 * y permite crear el autor si todavía no existe.
 */
export function SelectorAutores({ error, onCambiar, seleccionados }: SelectorAutoresProps) {
  const id = useId();
  const [texto, setTexto] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [creando, setCreando] = useState(false);
  const [errorCrear, setErrorCrear] = useState<string | null>(null);

  // Espera a que se deje de escribir antes de consultar.
  useEffect(() => {
    const espera = setTimeout(() => setBusqueda(texto.trim()), 300);
    return () => clearTimeout(espera);
  }, [texto]);

  const resultados = useConsulta(
    `autores|${busqueda}`,
    busqueda.length >= 2
      ? (signal) =>
          listarAutores({ pagina: 1, tamano: 8, nombre: busqueda, ordenarPor: 'nombre', direccion: 'asc' }, signal)
      : null,
  );

  const yaElegido = (autorId: string) => seleccionados.some((a) => a.id === autorId);
  const agregar = (autor: Referencia) => {
    if (!yaElegido(autor.id)) onCambiar([...seleccionados, { id: autor.id, nombre: autor.nombre }]);
    setTexto('');
  };
  const quitar = (autorId: string) => onCambiar(seleccionados.filter((a) => a.id !== autorId));
  const subir = (indice: number) => {
    const lista = [...seleccionados];
    [lista[indice - 1], lista[indice]] = [lista[indice], lista[indice - 1]];
    onCambiar(lista);
  };

  const crearNuevo = async () => {
    setCreando(true);
    setErrorCrear(null);
    try {
      agregar(await crearAutor({ nombre: busqueda }));
    } catch (e) {
      setErrorCrear(normalizarError(e).mensaje);
    } finally {
      setCreando(false);
    }
  };

  const hayExacto =
    resultados.estado === 'listo' &&
    resultados.datos.items.some((a) => a.nombre.toLowerCase() === busqueda.toLowerCase());

  return (
    <fieldset aria-describedby={error ? `${id}-error` : undefined} className={styles.grupo}>
      <legend>Autores</legend>
      <p className={styles.ayuda}>En el orden en que aparecen en la portada. Al menos uno.</p>
      {seleccionados.length > 0 ? (
        <ol className={styles.elegidos}>
          {seleccionados.map((autor, i) => (
            <li key={autor.id}>
              <span>{autor.nombre}</span>
              {i > 0 ? (
                <button aria-label={`Subir a ${autor.nombre}`} onClick={() => subir(i)} type="button">
                  <ArrowUp aria-hidden="true" size={18} />
                </button>
              ) : null}
              <button aria-label={`Quitar a ${autor.nombre}`} onClick={() => quitar(autor.id)} type="button">
                <X aria-hidden="true" size={18} />
              </button>
            </li>
          ))}
        </ol>
      ) : (
        <p className={styles.vacio}>Todavía no hay autores.</p>
      )}
      {error ? (
        <p className={styles.error} id={`${id}-error`}>
          {error}
        </p>
      ) : null}

      <label className={styles.etiquetaBusqueda} htmlFor={`${id}-buscar`}>
        Buscar un autor para agregarlo
      </label>
      <input
        autoComplete="off"
        className={styles.control}
        id={`${id}-buscar`}
        maxLength={200}
        onChange={(e) => setTexto(e.target.value)}
        type="search"
        value={texto}
      />
      {busqueda.length >= 2 ? (
        <div aria-live="polite" className={styles.resultados}>
          {resultados.estado === 'cargando' ? (
            <p>Buscando…</p>
          ) : resultados.estado === 'error' ? (
            <p>No se pudo buscar: {resultados.error.mensaje}</p>
          ) : (
            <>
              {resultados.datos.items.length === 0 ? <p>No hay autores con ese nombre.</p> : null}
              <ul>
                {resultados.datos.items.map((autor) => (
                  <li key={autor.id}>
                    <button disabled={yaElegido(autor.id)} onClick={() => agregar(autor)} type="button">
                      <Plus aria-hidden="true" size={18} />
                      {autor.nombre}
                      {yaElegido(autor.id) ? <span> (ya agregado)</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
              {!hayExacto ? (
                <button className={styles.crear} disabled={creando} onClick={() => void crearNuevo()} type="button">
                  <UserPlus aria-hidden="true" size={18} />
                  {creando ? 'Creando…' : `Crear el autor «${busqueda}» y agregarlo`}
                </button>
              ) : null}
              {errorCrear ? <p className={styles.error}>{errorCrear}</p> : null}
            </>
          )}
        </div>
      ) : null}
    </fieldset>
  );
}
