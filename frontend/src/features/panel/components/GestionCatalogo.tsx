import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, Pencil, Plus, RotateCw, Search, Trash2, X } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { normalizarError } from '../../../api/errores';
import { RUTAS } from '../../../config/rutas';
import { useConsulta } from '../../../shared/hooks/useConsulta';
import { Boton } from '../../../shared/ui/Boton';
import { Paginacion } from '../../busqueda/components/Paginacion';
import type { Direccion, FiltroListado, OrdenNombre, Pagina } from '../api/catalogo-admin.api';
import { FormularioElemento, type DatosElemento } from './FormularioElemento';
import styles from './GestionCatalogo.module.css';

export const ELEMENTOS_POR_PAGINA = 20;

interface ElementoBase {
  id: string;
  nombre: string;
  descripcion?: string | null;
  totalLibros?: number;
}

const ORDENES: { valor: string; etiqueta: string; ordenarPor: OrdenNombre; direccion: Direccion }[] = [
  { valor: 'nombre-asc', etiqueta: 'Nombre (A-Z)', ordenarPor: 'nombre', direccion: 'asc' },
  { valor: 'nombre-desc', etiqueta: 'Nombre (Z-A)', ordenarPor: 'nombre', direccion: 'desc' },
  { valor: 'creadoEn-desc', etiqueta: 'Más recientes', ordenarPor: 'creadoEn', direccion: 'desc' },
  { valor: 'creadoEn-asc', etiqueta: 'Más antiguos', ordenarPor: 'creadoEn', direccion: 'asc' },
];

export interface GestionCatalogoProps<T extends ElementoBase> {
  /** «Autores» */
  titulo: string;
  /** «autor»: se usa en botones y mensajes. */
  singular: string;
  introduccion: string;
  nombreMax: number;
  conDescripcion?: boolean;
  /** Muestra la columna «Libros» (el backend la envía para los temas). */
  conTotalLibros?: boolean;
  listar: (filtro: FiltroListado, signal: AbortSignal) => Promise<Pagina<T>>;
  crear: (datos: DatosElemento) => Promise<T>;
  actualizar: (id: string, datos: DatosElemento) => Promise<T>;
  eliminar: (id: string) => Promise<void>;
}

type Modo<T> = { tipo: 'crear' } | { tipo: 'editar'; elemento: T } | null;

/**
 * HU-25: listado paginado con filtro por nombre y ordenamiento, más crear, editar y eliminar.
 * Lo usan las páginas de autores y de temas. El filtro, el orden y la página quedan en la URL.
 */
export function GestionCatalogo<T extends ElementoBase>({
  actualizar,
  conDescripcion = false,
  conTotalLibros = false,
  crear,
  eliminar,
  introduccion,
  listar,
  nombreMax,
  singular,
  titulo,
}: GestionCatalogoProps<T>) {
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const filtroNombre = (params.get('q') ?? '').trim();
  const orden = ORDENES.find((o) => o.valor === params.get('orden')) ?? ORDENES[0];
  const paginaUrl = Number(params.get('pagina'));
  const pagina = Number.isInteger(paginaUrl) && paginaUrl > 1 ? paginaUrl : 1;

  const consulta = useConsulta(`${filtroNombre}|${orden.valor}|${pagina}`, (signal) =>
    listar(
      {
        pagina,
        tamano: ELEMENTOS_POR_PAGINA,
        nombre: filtroNombre || undefined,
        ordenarPor: orden.ordenarPor,
        direccion: orden.direccion,
      },
      signal,
    ),
  );

  const [modo, setModo] = useState<Modo<T>>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [eliminando, setEliminando] = useState(false);
  const [aviso, setAviso] = useState('');
  const [errorAccion, setErrorAccion] = useState<string | null>(null);
  const [textoFiltro, setTextoFiltro] = useState(filtroNombre);
  const enfocarBotonNuevo = () => document.getElementById('boton-nuevo-elemento')?.focus();

  useEffect(() => setTextoFiltro(filtroNombre), [filtroNombre]);

  const actualizarUrl = (cambios: Record<string, string | null>) => {
    const siguiente = new URLSearchParams(params);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) siguiente.set(clave, valor);
      else siguiente.delete(clave);
    }
    setParams(siguiente);
  };

  const urlDePagina = (n: number) => {
    const siguiente = new URLSearchParams(params);
    if (n > 1) siguiente.set('pagina', String(n));
    else siguiente.delete('pagina');
    const consultaUrl = siguiente.toString();
    return consultaUrl ? `${pathname}?${consultaUrl}` : pathname;
  };

  const filtrar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    actualizarUrl({ q: textoFiltro.trim() || null, pagina: null });
  };

  const guardar = async (datos: DatosElemento) => {
    const editado = modo?.tipo === 'editar' ? modo.elemento : null;
    const guardado = editado ? await actualizar(editado.id, datos) : await crear(datos);
    setModo(null);
    setErrorAccion(null);
    setAviso(`${mayuscula(singular)} «${guardado.nombre}» ${editado ? 'actualizado' : 'creado'}.`);
    consulta.reintentar();
    enfocarBotonNuevo();
  };

  const confirmarEliminacion = async (elemento: T) => {
    setEliminando(true);
    setErrorAccion(null);
    try {
      await eliminar(elemento.id);
      setAviso(`${mayuscula(singular)} «${elemento.nombre}» eliminado.`);
      consulta.reintentar();
    } catch (error) {
      setErrorAccion(normalizarError(error).mensaje);
    } finally {
      setEliminando(false);
      setConfirmando(null);
    }
  };

  const columnas = 2 + (conDescripcion ? 1 : 0) + (conTotalLibros ? 1 : 0);

  return (
    <section aria-labelledby="gestion-titulo" className={styles.pagina}>
      <title>{`${titulo} · Panel · Consulta Fácil`}</title>
      <Link className={styles.volver} to={RUTAS.panel}>
        <ArrowLeft aria-hidden="true" size={20} />
        Volver al panel
      </Link>
      <header className={styles.cabecera}>
        <div>
          <h1 id="gestion-titulo">{titulo}</h1>
          <p>{introduccion}</p>
        </div>
        <Boton
          icono={Plus}
          onClick={() => {
            setModo({ tipo: 'crear' });
            setAviso('');
          }}
          id='boton-nuevo-elemento'
          variante="oscuro"
        >
          Nuevo {singular}
        </Boton>
      </header>

      <p aria-live="polite" className={styles.aviso}>
        {aviso}
      </p>
      {errorAccion ? (
        <p className={styles.errorAccion} role="alert">
          {errorAccion}
        </p>
      ) : null}

      {modo ? (
        <FormularioElemento
          conDescripcion={conDescripcion}
          inicial={modo.tipo === 'editar' ? modo.elemento : undefined}
          key={modo.tipo === 'editar' ? modo.elemento.id : 'nuevo'}
          nombreMax={nombreMax}
          onCancelar={() => {
            setModo(null);
            enfocarBotonNuevo();
          }}
          onGuardar={guardar}
          singular={singular}
        />
      ) : null}

      <div className={styles.herramientas}>
        <form className={styles.filtro} onSubmit={filtrar} role="search">
          <label htmlFor="filtro-nombre">Buscar por nombre</label>
          <div>
            <input
              id="filtro-nombre"
              maxLength={nombreMax}
              onChange={(e) => setTextoFiltro(e.target.value)}
              type="search"
              value={textoFiltro}
            />
            <Boton icono={Search} type="submit" variante="oscuro">
              Buscar
            </Boton>
            {filtroNombre ? (
              <button
                className={styles.limpiar}
                onClick={() => actualizarUrl({ q: null, pagina: null })}
                type="button"
              >
                <X aria-hidden="true" size={18} /> Limpiar
              </button>
            ) : null}
          </div>
        </form>
        <div className={styles.orden}>
          <label htmlFor="orden">Ordenar por</label>
          <select
            id="orden"
            onChange={(e) => actualizarUrl({ orden: e.target.value === ORDENES[0].valor ? null : e.target.value, pagina: null })}
            value={orden.valor}
          >
            {ORDENES.map((o) => (
              <option key={o.valor} value={o.valor}>
                {o.etiqueta}
              </option>
            ))}
          </select>
        </div>
      </div>

      {consulta.estado === 'cargando' ? (
        <p role="status">Cargando…</p>
      ) : consulta.estado === 'error' ? (
        <div className={styles.errorCarga} role="alert">
          <p>No se pudo cargar el listado: {consulta.error.mensaje}</p>
          <Boton icono={RotateCw} onClick={consulta.reintentar} variante="oscuro">
            Intentar de nuevo
          </Boton>
        </div>
      ) : (
        <>
          <div className={styles.tablaContenedor}>
            <table className={styles.tabla}>
              <caption>
                {consulta.datos.total === 0
                  ? filtroNombre
                    ? `No hay ${titulo.toLowerCase()} que coincidan con «${filtroNombre}».`
                    : `Todavía no hay ${titulo.toLowerCase()}.`
                  : `${consulta.datos.total} ${titulo.toLowerCase()}${filtroNombre ? ` que coinciden con «${filtroNombre}»` : ''}`}
              </caption>
              <thead>
                <tr>
                  <th scope="col">Nombre</th>
                  {conDescripcion ? <th scope="col">Descripción</th> : null}
                  {conTotalLibros ? (
                    <th className={styles.numero} scope="col">
                      Libros
                    </th>
                  ) : null}
                  <th scope="col">
                    <span className="visualmente-oculto">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {consulta.datos.items.map((elemento) =>
                  confirmando === elemento.id ? (
                    <tr className={styles.confirmar} key={elemento.id}>
                      <td colSpan={columnas}>
                        <p id={`confirmar-${elemento.id}`}>
                          ¿Eliminar {singular} «{elemento.nombre}»? Esta acción no se puede deshacer.
                        </p>
                        <div className={styles.acciones}>
                          <button
                            aria-describedby={`confirmar-${elemento.id}`}
                            className={styles.peligro}
                            disabled={eliminando}
                            onClick={() => void confirmarEliminacion(elemento)}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" size={18} /> Sí, eliminar
                          </button>
                          <button className={styles.secundario} onClick={() => setConfirmando(null)} type="button">
                            Cancelar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    <tr key={elemento.id}>
                      <th scope="row">{elemento.nombre}</th>
                      {conDescripcion ? <td className={styles.descripcion}>{elemento.descripcion || '—'}</td> : null}
                      {conTotalLibros ? <td className={styles.numero}>{elemento.totalLibros ?? 0}</td> : null}
                      <td>
                        <div className={styles.acciones}>
                          <button
                            aria-label={`Editar ${elemento.nombre}`}
                            className={styles.secundario}
                            onClick={() => {
                              setModo({ tipo: 'editar', elemento });
                              setAviso('');
                            }}
                            type="button"
                          >
                            <Pencil aria-hidden="true" size={18} /> Editar
                          </button>
                          <button
                            aria-label={`Eliminar ${elemento.nombre}`}
                            className={styles.secundario}
                            onClick={() => {
                              setConfirmando(elemento.id);
                              setErrorAccion(null);
                            }}
                            type="button"
                          >
                            <Trash2 aria-hidden="true" size={18} /> Eliminar
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )}
              </tbody>
            </table>
          </div>
          <Paginacion
            pagina={consulta.datos.pagina}
            totalPaginas={Math.ceil(consulta.datos.total / consulta.datos.tamano)}
            urlDePagina={urlDePagina}
          />
        </>
      )}
    </section>
  );
}

function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}
