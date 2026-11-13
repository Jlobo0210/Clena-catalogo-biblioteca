import { useEffect, useState, type FormEvent } from 'react';
import { ArrowLeft, CalendarSearch, Mail, RotateCw, Undo2, X } from 'lucide-react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import { useConsulta } from '../../shared/hooks/useConsulta';
import { Boton } from '../../shared/ui/Boton';
import { Paginacion } from '../busqueda/components/Paginacion';
import gestion from '../panel/components/GestionCatalogo.module.css';
import {
  listarPrestamos,
  obtenerResumenPrestamos,
  type EstadoSeguimiento,
  type ResumenPrestamos,
} from './api/prestamos.api';
import type { Prestamo } from './types';
import { DIAS_AVISO, formatearDia, formatearInstante, textoPlazo, urgenciaDe } from './urgencia';
import plazos from './PrestamosPersonalPage.module.css';
import styles from './SeguimientoPrestamosPage.module.css';

export const PRESTAMOS_POR_PAGINA = 20;

const ESTADOS: { valor: EstadoSeguimiento; etiqueta: string; titulo: string; vacio: string }[] = [
  { valor: 'VENCIDO', etiqueta: 'Vencidos', titulo: 'Préstamos vencidos', vacio: 'No hay préstamos vencidos.' },
  {
    valor: 'POR_VENCER',
    etiqueta: `Vencen en ${DIAS_AVISO} días o menos`,
    titulo: 'Préstamos próximos a vencer',
    vacio: `No hay préstamos que venzan en los próximos ${DIAS_AVISO} días.`,
  },
  {
    valor: 'SIN_DEVOLVER',
    etiqueta: 'Todos los sin devolver',
    titulo: 'Préstamos sin devolver',
    vacio: 'No hay préstamos sin devolver.',
  },
  { valor: 'DEVUELTO', etiqueta: 'Devueltos', titulo: 'Préstamos devueltos', vacio: 'No hay préstamos devueltos.' },
];

const ORDENES = [
  { valor: 'limite-asc', etiqueta: 'Fecha límite (más antigua primero)', ordenarPor: 'fechaLimite', direccion: 'asc' },
  { valor: 'limite-desc', etiqueta: 'Fecha límite (más reciente primero)', ordenarPor: 'fechaLimite', direccion: 'desc' },
  { valor: 'prestamo-desc', etiqueta: 'Prestados recientemente', ordenarPor: 'fechaPrestamo', direccion: 'desc' },
] as const;

const FORMATO_DIA = /^\d{4}-\d{2}-\d{2}$/;
const diaValido = (v: string | null) => (v && FORMATO_DIA.test(v) ? v : undefined);
const plural = (n: number, palabra: string) => `${n} ${palabra}${n === 1 ? '' : 's'}`;

/** Días de retraso, para la columna: el texto no depende del color. */
function textoRetraso(p: Prestamo): string {
  if (p.fechaDevolucion || p.diasRestantes === null) return '—';
  const dias = Math.max(0, -p.diasRestantes);
  return dias === 0 ? 'Sin retraso' : plural(dias, 'día');
}

function enlaceCorreo(p: Prestamo): string {
  const asunto = `Devolución de «${p.libro.titulo}» - Biblioteca`;
  const cuerpo =
    `Hola, ${p.usuario.nombre}:\n\n` +
    `Le recordamos que el libro «${p.libro.titulo}» (ejemplar ${p.ejemplar.codigoInventario}) ` +
    `debía devolverse hasta el ${formatearDia(p.fechaLimite)}.\n\n` +
    'Puede devolverlo en el mostrador de la biblioteca. Gracias.';
  return `mailto:${p.usuario.email}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
}

/** HU-36: el personal hace seguimiento a los préstamos vencidos y próximos a vencer. */
export function SeguimientoPrestamosPage() {
  const [params, setParams] = useSearchParams();
  const { pathname } = useLocation();
  const estado = ESTADOS.find((e) => e.valor === params.get('estado')) ?? ESTADOS[0];
  const orden = ORDENES.find((o) => o.valor === params.get('orden')) ?? ORDENES[0];
  const desde = diaValido(params.get('desde'));
  const hasta = diaValido(params.get('hasta'));
  const paginaUrl = Number(params.get('pagina'));
  const pagina = Number.isInteger(paginaUrl) && paginaUrl > 1 ? paginaUrl : 1;

  const resumen = useConsulta<ResumenPrestamos>('resumen', (signal) => obtenerResumenPrestamos(signal));
  const consulta = useConsulta(`${estado.valor}|${orden.valor}|${desde}|${hasta}|${pagina}`, (signal) =>
    listarPrestamos(
      {
        estado: estado.valor,
        limiteDesde: desde,
        limiteHasta: hasta,
        ordenarPor: orden.ordenarPor,
        direccion: orden.direccion,
        pagina,
        tamano: PRESTAMOS_POR_PAGINA,
      },
      signal,
    ),
  );

  const [desdeCampo, setDesdeCampo] = useState(desde ?? '');
  const [hastaCampo, setHastaCampo] = useState(hasta ?? '');
  const [errorFechas, setErrorFechas] = useState<string | null>(null);
  useEffect(() => setDesdeCampo(desde ?? ''), [desde]);
  useEffect(() => setHastaCampo(hasta ?? ''), [hasta]);

  const actualizarUrl = (cambios: Record<string, string | null | undefined>) => {
    const siguiente = new URLSearchParams(params);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) siguiente.set(clave, valor);
      else siguiente.delete(clave);
    }
    siguiente.delete('pagina');
    setParams(siguiente);
  };

  const urlCon = (cambios: Record<string, string | null>) => {
    const siguiente = new URLSearchParams(params);
    for (const [clave, valor] of Object.entries(cambios)) {
      if (valor) siguiente.set(clave, valor);
      else siguiente.delete(clave);
    }
    const consultaUrl = siguiente.toString();
    return consultaUrl ? `${pathname}?${consultaUrl}` : pathname;
  };

  const urlDePagina = (n: number) => urlCon({ pagina: n > 1 ? String(n) : null });
  const urlDeEstado = (valor: EstadoSeguimiento) =>
    urlCon({ estado: valor === ESTADOS[0].valor ? null : valor, pagina: null });

  const aplicarFechas = (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    if (desdeCampo && hastaCampo && desdeCampo > hastaCampo) {
      setErrorFechas('La fecha «desde» no puede ser posterior a la fecha «hasta».');
      return;
    }
    setErrorFechas(null);
    actualizarUrl({ desde: desdeCampo || null, hasta: hastaCampo || null });
  };

  const hayFechas = Boolean(desde || hasta);
  const devueltos = estado.valor === 'DEVUELTO';

  return (
    <section aria-labelledby="seguimiento-titulo" className={gestion.pagina}>
      <title>Seguimiento de préstamos · Panel · Consulta Fácil</title>
      <Link className={gestion.volver} to={RUTAS.panel}>
        <ArrowLeft aria-hidden="true" size={20} />
        Volver al panel
      </Link>
      <header className={gestion.cabecera}>
        <div>
          <h1 id="seguimiento-titulo">Seguimiento de préstamos</h1>
          <p>Préstamos vencidos y próximos a vencer, para avisar a tiempo a cada persona.</p>
        </div>
        <Link className={gestion.enlacePrincipal} to={RUTAS.prestamosPersonal}>
          <Undo2 aria-hidden="true" size={20} />
          Registrar devoluciones
        </Link>
      </header>

      <section aria-labelledby="resumen-titulo">
        <h2 className="visualmente-oculto" id="resumen-titulo">
          Resumen de hoy
        </h2>
        {resumen.estado === 'error' ? (
          <p className={gestion.errorAccion} role="alert">
            No se pudo cargar el resumen: {resumen.error.mensaje}
          </p>
        ) : (
          <ul aria-busy={resumen.estado === 'cargando'} className={styles.resumen}>
            <li className={styles.vencidos}>
              <Link aria-current={estado.valor === 'VENCIDO' ? 'true' : undefined} to={urlDeEstado('VENCIDO')}>
                <strong>{resumen.estado === 'listo' ? resumen.datos.vencidos : '…'}</strong>
                vencidos
              </Link>
            </li>
            <li className={styles.proximos}>
              <Link aria-current={estado.valor === 'POR_VENCER' ? 'true' : undefined} to={urlDeEstado('POR_VENCER')}>
                <strong>{resumen.estado === 'listo' ? resumen.datos.porVencer : '…'}</strong>
                vencen en {DIAS_AVISO} días o menos
              </Link>
            </li>
            <li>
              <Link aria-current={estado.valor === 'SIN_DEVOLVER' ? 'true' : undefined} to={urlDeEstado('SIN_DEVOLVER')}>
                <strong>{resumen.estado === 'listo' ? resumen.datos.sinDevolver : '…'}</strong>
                sin devolver en total
              </Link>
            </li>
          </ul>
        )}
      </section>

      <div className={gestion.herramientas}>
        <div className={gestion.orden}>
          <label htmlFor="filtro-estado">Mostrar</label>
          <select
            id="filtro-estado"
            onChange={(e) => actualizarUrl({ estado: e.target.value === ESTADOS[0].valor ? null : e.target.value })}
            value={estado.valor}
          >
            {ESTADOS.map((e) => (
              <option key={e.valor} value={e.valor}>
                {e.etiqueta}
              </option>
            ))}
          </select>
        </div>
        <form aria-labelledby="fechas-titulo" className={styles.fechas} noValidate onSubmit={aplicarFechas}>
          <p className={styles.fechasTitulo} id="fechas-titulo">
            Fecha límite
          </p>
          <div>
            <label htmlFor="filtro-desde">Desde</label>
            <input
              aria-describedby={errorFechas ? 'error-fechas' : undefined}
              aria-invalid={errorFechas ? true : undefined}
              id="filtro-desde"
              onChange={(e) => setDesdeCampo(e.target.value)}
              type="date"
              value={desdeCampo}
            />
          </div>
          <div>
            <label htmlFor="filtro-hasta">Hasta</label>
            <input
              aria-describedby={errorFechas ? 'error-fechas' : undefined}
              aria-invalid={errorFechas ? true : undefined}
              id="filtro-hasta"
              onChange={(e) => setHastaCampo(e.target.value)}
              type="date"
              value={hastaCampo}
            />
          </div>
          <div className={styles.botonesFechas}>
            <Boton icono={CalendarSearch} type="submit" variante="oscuro">
              Aplicar fechas
            </Boton>
            {hayFechas ? (
              <button
                className={gestion.limpiar}
                onClick={() => {
                  setErrorFechas(null);
                  actualizarUrl({ desde: null, hasta: null });
                }}
                type="button"
              >
                <X aria-hidden="true" size={18} /> Quitar fechas
              </button>
            ) : null}
          </div>
          {errorFechas ? (
            <p className={styles.errorFechas} id="error-fechas" role="alert">
              {errorFechas}
            </p>
          ) : null}
        </form>
        <div className={gestion.orden}>
          <label htmlFor="orden">Ordenar por</label>
          <select
            id="orden"
            onChange={(e) => actualizarUrl({ orden: e.target.value === ORDENES[0].valor ? null : e.target.value })}
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
        <p role="status">Cargando préstamos…</p>
      ) : consulta.estado === 'error' ? (
        <div className={gestion.errorCarga} role="alert">
          <p>No se pudo cargar el listado: {consulta.error.mensaje}</p>
          <Boton icono={RotateCw} onClick={consulta.reintentar} variante="oscuro">
            Intentar de nuevo
          </Boton>
        </div>
      ) : (
        <>
          <p className={styles.total} role="status">
            {consulta.datos.total === 0
              ? hayFechas
                ? `${estado.vacio.slice(0, -1)} con esas fechas.`
                : estado.vacio
              : `${estado.titulo}: ${consulta.datos.total}${hayFechas ? ' con esas fechas' : ''}.`}
          </p>
          {consulta.datos.total > 0 ? (
            <div className={gestion.tablaContenedor}>
              <table className={gestion.tabla}>
                <caption className="visualmente-oculto">
                  {estado.titulo}, ordenados por {orden.etiqueta.toLowerCase()}
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Usuario</th>
                    <th scope="col">Libro y ejemplar</th>
                    <th scope="col">{devueltos ? 'Devuelto el' : 'Fecha límite'}</th>
                    <th className={gestion.numero} scope="col">
                      Días de retraso
                    </th>
                    <th scope="col">
                      <span className="visualmente-oculto">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {consulta.datos.items.map((p) => (
                    <tr key={p.id}>
                      <th scope="row">
                        {p.usuario.nombre}
                        <span className={styles.dato}>{p.usuario.email}</span>
                      </th>
                      <td>
                        {p.libro.titulo}
                        <span className={styles.dato}>{p.ejemplar.codigoInventario}</span>
                      </td>
                      <td>
                        {p.fechaDevolucion ? (
                          <>
                            {formatearInstante(p.fechaDevolucion)}
                            <span className={styles.dato}>Límite: {formatearDia(p.fechaLimite)}</span>
                          </>
                        ) : (
                          <>
                            {formatearDia(p.fechaLimite)}
                            <span className={`${plazos.plazo} ${plazos[urgenciaDe(p)]}`}>{textoPlazo(p)}</span>
                          </>
                        )}
                      </td>
                      <td className={gestion.numero}>{textoRetraso(p)}</td>
                      <td>
                        {p.fechaDevolucion ? null : (
                          <a
                            aria-label={`Escribir a ${p.usuario.nombre} sobre «${p.libro.titulo}»`}
                            className={gestion.secundario}
                            href={enlaceCorreo(p)}
                          >
                            <Mail aria-hidden="true" size={18} /> Escribir
                          </a>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
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
