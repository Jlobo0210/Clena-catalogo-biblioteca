import { useEffect, useId, useState, type FormEvent } from 'react';
import { MapPinPlus, Pencil, Plus, RotateCw, Save, Trash2, X } from 'lucide-react';
import { normalizarError } from '../../../api/errores';
import { useConsulta } from '../../../shared/hooks/useConsulta';
import { Boton } from '../../../shared/ui/Boton';
import { CampoTexto } from '../../auth/components/CampoTexto';
import { ResumenErrores } from '../../auth/components/ResumenErrores';
import { listarEjemplares } from '../../catalogo/api/libros.api';
import { NOMBRE_ESTADO_EJEMPLAR } from '../../catalogo/etiquetas';
import type { EjemplarDto, EstadoEjemplar, UbicacionDto } from '../../catalogo/types';
import {
  actualizarEjemplar,
  crearEjemplar,
  crearUbicacion,
  eliminarEjemplar,
  listarUbicaciones,
  type DatosEjemplar,
} from '../api/catalogo-admin.api';
import estilos from './GestionCatalogo.module.css';
import styles from './LibroFormulario.module.css';

/** PRESTADO no se elige a mano: lo pone el registro de préstamos (HU-26). */
const ESTADOS_ELEGIBLES: EstadoEjemplar[] = ['DISPONIBLE', 'EN_REPARACION', 'PERDIDO'];

const describir = (u: UbicacionDto) => `${u.sala} · Sección ${u.seccion} · Estante ${u.estante}`;

type Modo = { tipo: 'crear' } | { tipo: 'editar'; ejemplar: EjemplarDto } | null;

/** HU-25: ejemplares de un libro con su ubicación física (usa la API de HU-17). */
export function EjemplaresLibro({ libroId }: { libroId: string }) {
  const ejemplares = useConsulta(`ejemplares|${libroId}`, (signal) => listarEjemplares(libroId, signal));
  const [ubicaciones, setUbicaciones] = useState<UbicacionDto[] | null>(null);
  const [errorUbicaciones, setErrorUbicaciones] = useState<string | null>(null);
  const [modo, setModo] = useState<Modo>(null);
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [aviso, setAviso] = useState('');
  const [errorAccion, setErrorAccion] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    listarUbicaciones(controller.signal)
      .then(setUbicaciones)
      .catch((e: unknown) => {
        if (!controller.signal.aborted) setErrorUbicaciones(normalizarError(e).mensaje);
      });
    return () => controller.abort();
  }, []);

  const guardar = async (datos: DatosEjemplar) => {
    const editado = modo?.tipo === 'editar' ? modo.ejemplar : null;
    const guardado = editado
      ? await actualizarEjemplar(libroId, editado.id, datos)
      : await crearEjemplar(libroId, datos);
    setModo(null);
    setAviso(`Ejemplar ${guardado.codigoInventario} ${editado ? 'actualizado' : 'registrado'}.`);
    ejemplares.reintentar();
  };

  const eliminar = async (ejemplar: EjemplarDto) => {
    setErrorAccion(null);
    try {
      await eliminarEjemplar(libroId, ejemplar.id);
      setAviso(`Ejemplar ${ejemplar.codigoInventario} eliminado.`);
      ejemplares.reintentar();
    } catch (e) {
      setErrorAccion(normalizarError(e).mensaje);
    } finally {
      setConfirmando(null);
    }
  };

  return (
    <section aria-labelledby="ejemplares-titulo" className={styles.ejemplares}>
      <div className={estilos.cabecera}>
        <div>
          <h2 id="ejemplares-titulo">Ejemplares</h2>
          <p>Cada copia física del libro, con su código de inventario y dónde está.</p>
        </div>
        <Boton
          icono={Plus}
          onClick={() => {
            setModo({ tipo: 'crear' });
            setAviso('');
          }}
          variante="oscuro"
        >
          Agregar ejemplar
        </Boton>
      </div>
      <p aria-live="polite" className={estilos.aviso}>
        {aviso}
      </p>
      {errorAccion ? (
        <p className={estilos.errorAccion} role="alert">
          {errorAccion}
        </p>
      ) : null}
      {errorUbicaciones ? (
        <p className={estilos.errorAccion} role="alert">
          No se pudieron cargar las ubicaciones: {errorUbicaciones}
        </p>
      ) : null}

      {modo && ubicaciones ? (
        <FormularioEjemplar
          ejemplar={modo.tipo === 'editar' ? modo.ejemplar : undefined}
          key={modo.tipo === 'editar' ? modo.ejemplar.id : 'nuevo'}
          onAgregarUbicacion={(u) => setUbicaciones((lista) => [...(lista ?? []), u])}
          onCancelar={() => setModo(null)}
          onGuardar={guardar}
          ubicaciones={ubicaciones}
        />
      ) : null}

      {ejemplares.estado === 'cargando' ? (
        <p role="status">Cargando ejemplares…</p>
      ) : ejemplares.estado === 'error' ? (
        <div className={estilos.errorCarga} role="alert">
          <p>No se pudieron cargar los ejemplares: {ejemplares.error.mensaje}</p>
          <Boton icono={RotateCw} onClick={ejemplares.reintentar} variante="oscuro">
            Intentar de nuevo
          </Boton>
        </div>
      ) : (
        <div className={estilos.tablaContenedor}>
          <table className={estilos.tabla}>
            <caption>
              {ejemplares.datos.items.length === 0
                ? 'Este libro todavía no tiene ejemplares.'
                : `${ejemplares.datos.disponibilidad.disponibles} de ${ejemplares.datos.disponibilidad.totalEjemplares} disponibles`}
            </caption>
            <thead>
              <tr>
                <th scope="col">Código</th>
                <th scope="col">Ubicación</th>
                <th scope="col">Estado</th>
                <th scope="col">
                  <span className="visualmente-oculto">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {ejemplares.datos.items.map((ejemplar) =>
                confirmando === ejemplar.id ? (
                  <tr className={estilos.confirmar} key={ejemplar.id}>
                    <td colSpan={4}>
                      <p id={`confirmar-${ejemplar.id}`}>¿Eliminar el ejemplar {ejemplar.codigoInventario}?</p>
                      <div className={estilos.acciones}>
                        <button
                          aria-describedby={`confirmar-${ejemplar.id}`}
                          className={estilos.peligro}
                          onClick={() => void eliminar(ejemplar)}
                          type="button"
                        >
                          <Trash2 aria-hidden="true" size={18} /> Sí, eliminar
                        </button>
                        <button className={estilos.secundario} onClick={() => setConfirmando(null)} type="button">
                          Cancelar
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={ejemplar.id}>
                    <th scope="row">{ejemplar.codigoInventario}</th>
                    <td>{describir(ejemplar.ubicacion)}</td>
                    <td>
                      {NOMBRE_ESTADO_EJEMPLAR[ejemplar.estado]}
                      {ejemplar.observaciones ? <span className={styles.nota}> · {ejemplar.observaciones}</span> : null}
                    </td>
                    <td>
                      <div className={estilos.acciones}>
                        <button
                          aria-label={`Editar ejemplar ${ejemplar.codigoInventario}`}
                          className={estilos.secundario}
                          disabled={!ubicaciones}
                          onClick={() => {
                            setModo({ tipo: 'editar', ejemplar });
                            setAviso('');
                          }}
                          type="button"
                        >
                          <Pencil aria-hidden="true" size={18} /> Editar
                        </button>
                        <button
                          aria-label={`Eliminar ejemplar ${ejemplar.codigoInventario}`}
                          className={estilos.secundario}
                          onClick={() => {
                            setConfirmando(ejemplar.id);
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
      )}
    </section>
  );
}

interface FormularioEjemplarProps {
  ejemplar?: EjemplarDto;
  ubicaciones: UbicacionDto[];
  onAgregarUbicacion: (u: UbicacionDto) => void;
  onGuardar: (datos: DatosEjemplar) => Promise<void>;
  onCancelar: () => void;
}

function FormularioEjemplar({ ejemplar, onAgregarUbicacion, onCancelar, onGuardar, ubicaciones }: FormularioEjemplarProps) {
  const id = useId();
  const prestado = ejemplar?.estado === 'PRESTADO';
  const [codigo, setCodigo] = useState(ejemplar?.codigoInventario ?? '');
  const [ubicacionId, setUbicacionId] = useState(ejemplar?.ubicacion.id ?? '');
  const [estado, setEstado] = useState<EstadoEjemplar>(ejemplar?.estado ?? 'DISPONIBLE');
  const [observaciones, setObservaciones] = useState(ejemplar?.observaciones ?? '');
  const [nuevaUbicacion, setNuevaUbicacion] = useState(false);
  const [errores, setErrores] = useState<{ codigo?: string; ubicacion?: string }>({});
  const [errorServidor, setErrorServidor] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorServidor([]);
    const e: typeof errores = {};
    if (!codigo.trim()) e.codigo = 'Escribe el código de inventario.';
    else if (codigo.trim().length > 40) e.codigo = 'El código no puede superar 40 caracteres.';
    if (!ubicacionId) e.ubicacion = 'Elige dónde está el ejemplar.';
    setErrores(e);
    if (Object.keys(e).length > 0) return;
    setEnviando(true);
    try {
      await onGuardar({
        codigoInventario: codigo.trim(),
        ubicacionId,
        // Un ejemplar prestado conserva su estado: cambia al registrar la devolución.
        ...(prestado ? {} : { estado }),
        observaciones: observaciones.trim() || null,
      });
    } catch (error) {
      const n = normalizarError(error);
      setErrorServidor(n.detalles?.length ? n.detalles : [n.mensaje]);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <form aria-labelledby={`${id}-titulo`} className={estilos.formulario} noValidate onSubmit={(e) => void enviar(e)}>
      <h3 id={`${id}-titulo`}>{ejemplar ? `Editar ejemplar ${ejemplar.codigoInventario}` : 'Nuevo ejemplar'}</h3>
      <ResumenErrores
        mensajes={errorServidor.length ? errorServidor : Object.values(errores).filter((m): m is string => Boolean(m))}
        titulo="Revisa estos datos"
      />
      <CampoTexto
        autoComplete="off"
        error={errores.codigo}
        etiqueta="Código de inventario"
        maxLength={40}
        onChange={(e) => setCodigo(e.target.value)}
        required
        value={codigo}
      />
      <div className={styles.campo}>
        <label htmlFor={`${id}-ubicacion`}>Ubicación</label>
        <select
          aria-describedby={errores.ubicacion ? `${id}-ubicacion-error` : undefined}
          aria-invalid={errores.ubicacion ? true : undefined}
          className={styles.control}
          id={`${id}-ubicacion`}
          onChange={(e) => setUbicacionId(e.target.value)}
          value={ubicacionId}
        >
          <option value="">Elige sala, sección y estante</option>
          {ubicaciones.map((u) => (
            <option key={u.id} value={u.id}>
              {describir(u)}
            </option>
          ))}
        </select>
        {errores.ubicacion ? (
          <p className={styles.error} id={`${id}-ubicacion-error`}>
            {errores.ubicacion}
          </p>
        ) : null}
        {nuevaUbicacion ? (
          <NuevaUbicacion
            onCancelar={() => setNuevaUbicacion(false)}
            onCreada={(u) => {
              onAgregarUbicacion(u);
              setUbicacionId(u.id);
              setNuevaUbicacion(false);
            }}
          />
        ) : (
          <button className={styles.enlaceBoton} onClick={() => setNuevaUbicacion(true)} type="button">
            <MapPinPlus aria-hidden="true" size={18} /> ¿No está en la lista? Registrar una ubicación nueva
          </button>
        )}
      </div>
      <div className={styles.campo}>
        <label htmlFor={`${id}-estado`}>Estado</label>
        {prestado ? (
          <p className={styles.ayuda} id={`${id}-estado`}>
            Prestado. Vuelve a estar disponible cuando se registra la devolución.
          </p>
        ) : (
          <select
            className={styles.control}
            id={`${id}-estado`}
            onChange={(e) => setEstado(e.target.value as EstadoEjemplar)}
            value={estado}
          >
            {ESTADOS_ELEGIBLES.map((e) => (
              <option key={e} value={e}>
                {NOMBRE_ESTADO_EJEMPLAR[e]}
              </option>
            ))}
          </select>
        )}
      </div>
      <CampoTexto
        etiqueta="Observaciones (opcional)"
        maxLength={500}
        onChange={(e) => setObservaciones(e.target.value)}
        placeholder="Por ejemplo: lomo deteriorado"
        value={observaciones}
      />
      <div className={estilos.acciones}>
        <Boton disabled={enviando} icono={Save} type="submit">
          {enviando ? 'Guardando…' : 'Guardar ejemplar'}
        </Boton>
        <button className={estilos.secundario} onClick={onCancelar} type="button">
          <X aria-hidden="true" size={18} /> Cancelar
        </button>
      </div>
    </form>
  );
}

function NuevaUbicacion({ onCancelar, onCreada }: { onCancelar: () => void; onCreada: (u: UbicacionDto) => void }) {
  const [lugar, setLugar] = useState({ sala: '', seccion: '', estante: '' });
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  // No es un <form> propio: está dentro del formulario del ejemplar y los formularios no se anidan.
  const guardar = async () => {
    if (!lugar.sala.trim() || !lugar.seccion.trim() || !lugar.estante.trim()) {
      setError('Completa la sala, la sección y el estante.');
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      onCreada(await crearUbicacion(lugar));
    } catch (e) {
      setError(normalizarError(e).mensaje);
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div aria-label="Ubicación nueva" className={styles.nuevaUbicacion} role="group">
      {(['sala', 'seccion', 'estante'] as const).map((parte) => (
        <CampoTexto
          etiqueta={{ sala: 'Sala', seccion: 'Sección', estante: 'Estante' }[parte]}
          key={parte}
          maxLength={parte === 'estante' ? 30 : 60}
          onChange={(e) => setLugar((l) => ({ ...l, [parte]: e.target.value }))}
          onKeyDown={(e) => {
            // Enter aquí registra la ubicación, no envía el formulario del ejemplar.
            if (e.key === 'Enter') {
              e.preventDefault();
              void guardar();
            }
          }}
          value={lugar[parte]}
        />
      ))}
      {error ? (
        <p className={styles.error} role="alert">
          {error}
        </p>
      ) : null}
      <div className={estilos.acciones}>
        <button className={estilos.secundario} disabled={guardando} onClick={() => void guardar()} type="button">
          <Plus aria-hidden="true" size={18} /> {guardando ? 'Registrando…' : 'Registrar ubicación'}
        </button>
        <button className={estilos.secundario} onClick={onCancelar} type="button">
          Cancelar
        </button>
      </div>
    </div>
  );
}
