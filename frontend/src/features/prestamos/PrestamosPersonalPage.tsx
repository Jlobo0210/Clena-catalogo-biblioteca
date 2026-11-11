import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { BookUp, CircleCheck, Undo2 } from 'lucide-react';
import { normalizarError } from '../../api/errores';
import { Boton } from '../../shared/ui/Boton';
import { CampoTexto } from '../auth/components/CampoTexto';
import formulario from '../auth/components/Formulario.module.css';
import { ResumenErrores } from '../auth/components/ResumenErrores';
import { validarCorreo } from '../auth/validacion';
import { listarPrestamos, registrarDevolucion, registrarPrestamo } from './api/prestamos.api';
import type { Prestamo } from './types';
import { formatearDia, textoPlazo, urgenciaDe } from './urgencia';
import styles from './PrestamosPersonalPage.module.css';

type Vista = 'SIN_DEVOLVER' | 'VENCIDO';

interface Errores {
  codigoInventario?: string;
  usuarioEmail?: string;
}

/** HU-26: el personal presta ejemplares y registra devoluciones. */
export function PrestamosPersonalPage() {
  const [codigoInventario, setCodigo] = useState('');
  const [usuarioEmail, setCorreo] = useState('');
  const [errores, setErrores] = useState<Errores>({});
  const [errorServidor, setErrorServidor] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [confirmacion, setConfirmacion] = useState<string | null>(null);

  const [vista, setVista] = useState<Vista>('SIN_DEVOLVER');
  const [prestamos, setPrestamos] = useState<Prestamo[] | null>(null);
  const [errorLista, setErrorLista] = useState<string | null>(null);
  const [devolviendo, setDevolviendo] = useState<string | null>(null);

  const cargar = useCallback(async (v: Vista) => {
    try {
      const pagina = await listarPrestamos({ estado: v, ordenarPor: 'fechaLimite', direccion: 'asc', tamano: 100 });
      setPrestamos(pagina.items);
      setErrorLista(null);
    } catch (e) {
      setErrorLista(normalizarError(e).mensaje);
    }
  }, []);

  useEffect(() => {
    void cargar(vista);
  }, [cargar, vista]);

  const prestar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const nuevos: Errores = {};
    if (!codigoInventario.trim()) nuevos.codigoInventario = 'Escribe el código de inventario del ejemplar.';
    const correo = validarCorreo(usuarioEmail);
    if (correo) nuevos.usuarioEmail = correo;
    setErrores(nuevos);
    setErrorServidor(null);
    setConfirmacion(null);
    if (Object.keys(nuevos).length > 0) return;

    setEnviando(true);
    try {
      const p = await registrarPrestamo({
        codigoInventario: codigoInventario.trim(),
        usuarioEmail: usuarioEmail.trim(),
      });
      setConfirmacion(
        `Préstamo registrado: «${p.libro.titulo}» (${p.ejemplar.codigoInventario}) a ${p.usuario.nombre}. Debe devolverse hasta el ${formatearDia(p.fechaLimite)}.`,
      );
      setCodigo('');
      setCorreo('');
      await cargar(vista);
    } catch (e) {
      const error = normalizarError(e);
      setErrorServidor(error.detalles?.join(' ') || error.mensaje);
    } finally {
      setEnviando(false);
    }
  };

  const devolver = async (p: Prestamo) => {
    setDevolviendo(p.id);
    setConfirmacion(null);
    try {
      await registrarDevolucion(p.id);
      setConfirmacion(`Devolución registrada: «${p.libro.titulo}» (${p.ejemplar.codigoInventario}) ya está disponible.`);
      await cargar(vista);
    } catch (e) {
      setErrorLista(`No se pudo registrar la devolución: ${normalizarError(e).mensaje}`);
    } finally {
      setDevolviendo(null);
    }
  };

  const mensajes = errorServidor
    ? [errorServidor]
    : Object.values(errores).filter((m): m is string => Boolean(m));

  return (
    <section aria-labelledby="prestamos-titulo" className={styles.pagina}>
      <h1 id="prestamos-titulo">Préstamos y devoluciones</h1>

      <p aria-live="polite" className={styles.confirmacion}>
        {confirmacion ? (
          <>
            <CircleCheck aria-hidden="true" size={22} />
            {confirmacion}
          </>
        ) : null}
      </p>

      <section aria-labelledby="prestar-titulo" className={styles.bloque}>
        <h2 id="prestar-titulo">Registrar un préstamo</h2>
        <ResumenErrores mensajes={mensajes} titulo="No se pudo registrar el préstamo" />
        <form aria-busy={enviando} className={styles.formulario} noValidate onSubmit={prestar}>
          <CampoTexto
            autoComplete="off"
            ayuda="Está en la etiqueta del libro. Ejemplo: INV-0000-1"
            error={errores.codigoInventario}
            etiqueta="Código de inventario"
            maxLength={40}
            onChange={(e) => setCodigo(e.target.value)}
            required
            value={codigoInventario}
          />
          <CampoTexto
            autoComplete="off"
            ayuda="El correo con el que la persona creó su cuenta."
            error={errores.usuarioEmail}
            etiqueta="Correo del usuario"
            inputMode="email"
            onChange={(e) => setCorreo(e.target.value)}
            required
            type="email"
            value={usuarioEmail}
          />
          <Boton className={formulario.enviar} disabled={enviando} icono={BookUp} tamano="grande" type="submit" variante="oscuro">
            {enviando ? 'Registrando…' : 'Prestar'}
          </Boton>
        </form>
      </section>

      <section aria-labelledby="pendientes-titulo" className={styles.bloque}>
        <div className={styles.cabeceraLista}>
          <h2 id="pendientes-titulo">Préstamos sin devolver</h2>
          <fieldset className={styles.filtro}>
            <legend className="visualmente-oculto">Mostrar</legend>
            <label>
              <input checked={vista === 'SIN_DEVOLVER'} name="vista" onChange={() => setVista('SIN_DEVOLVER')} type="radio" />
              Todos
            </label>
            <label>
              <input checked={vista === 'VENCIDO'} name="vista" onChange={() => setVista('VENCIDO')} type="radio" />
              Solo vencidos
            </label>
          </fieldset>
        </div>

        {errorLista ? <p role="alert">{errorLista}</p> : null}
        {!prestamos && !errorLista ? <p role="status">Cargando préstamos…</p> : null}
        {prestamos && prestamos.length === 0 ? (
          <p className={styles.vacio}>
            {vista === 'VENCIDO' ? 'No hay préstamos vencidos.' : 'No hay préstamos sin devolver.'}
          </p>
        ) : null}
        {prestamos && prestamos.length > 0 ? (
          <div className={styles.tablaContenedor}>
            <table className={styles.tabla}>
              <caption className="visualmente-oculto">
                {vista === 'VENCIDO' ? 'Préstamos vencidos' : 'Préstamos sin devolver'}, ordenados por fecha límite
              </caption>
              <thead>
                <tr>
                  <th scope="col">Libro</th>
                  <th scope="col">Usuario</th>
                  <th scope="col">Devolver hasta</th>
                  <th scope="col">Acción</th>
                </tr>
              </thead>
              <tbody>
                {prestamos.map((p) => (
                  <tr key={p.id}>
                    <th scope="row">
                      {p.libro.titulo}
                      <span className={styles.secundario}>{p.ejemplar.codigoInventario}</span>
                    </th>
                    <td>
                      {p.usuario.nombre}
                      <span className={styles.secundario}>{p.usuario.email}</span>
                    </td>
                    <td>
                      {formatearDia(p.fechaLimite)}
                      <span className={`${styles.plazo} ${styles[urgenciaDe(p)]}`}>{textoPlazo(p)}</span>
                    </td>
                    <td>
                      <Boton
                        aria-label={`Registrar devolución de «${p.libro.titulo}», ${p.ejemplar.codigoInventario}`}
                        disabled={devolviendo === p.id}
                        icono={Undo2}
                        onClick={() => void devolver(p)}
                        variante="primario"
                      >
                        {devolviendo === p.id ? 'Registrando…' : 'Registrar devolución'}
                      </Boton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </section>
    </section>
  );
}
