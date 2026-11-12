import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { Save, X } from 'lucide-react';
import { normalizarError } from '../../../api/errores';
import { Boton } from '../../../shared/ui/Boton';
import { CampoTexto } from '../../auth/components/CampoTexto';
import { ResumenErrores } from '../../auth/components/ResumenErrores';
import estilosFormulario from '../../auth/components/Formulario.module.css';
import styles from './GestionCatalogo.module.css';

export interface DatosElemento {
  nombre: string;
  descripcion: string | null;
}

export const DESCRIPCION_MAX = 500;

interface FormularioElementoProps {
  singular: string;
  nombreMax: number;
  conDescripcion: boolean;
  /** Si llega, el formulario edita ese elemento; si no, crea uno nuevo. */
  inicial?: { nombre: string; descripcion?: string | null };
  onGuardar: (datos: DatosElemento) => Promise<void>;
  onCancelar: () => void;
}

/** Formulario de nombre (y descripción) con validación antes de enviar y errores del servidor (HU-25). */
export function FormularioElemento({
  conDescripcion,
  inicial,
  nombreMax,
  onCancelar,
  onGuardar,
  singular,
}: FormularioElementoProps) {
  const idDescripcion = useId();
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const [nombre, setNombre] = useState(inicial?.nombre ?? '');
  const [descripcion, setDescripcion] = useState(inicial?.descripcion ?? '');
  const [errores, setErrores] = useState<{ nombre?: string; descripcion?: string }>({});
  const [errorServidor, setErrorServidor] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);
  const editando = Boolean(inicial);

  // Al abrir el formulario, el foco va a su título para que se anuncie.
  useEffect(() => tituloRef.current?.focus(), []);

  const validar = () => {
    const nuevos: typeof errores = {};
    const limpio = nombre.trim().replace(/\s+/g, ' ');
    if (!limpio) nuevos.nombre = `Escribe el nombre del ${singular}.`;
    else if (limpio.length > nombreMax) nuevos.nombre = `El nombre no puede superar ${nombreMax} caracteres.`;
    if (conDescripcion && descripcion.trim().length > DESCRIPCION_MAX) {
      nuevos.descripcion = `La descripción no puede superar ${DESCRIPCION_MAX} caracteres.`;
    }
    setErrores(nuevos);
    return Object.keys(nuevos).length === 0 ? limpio : null;
  };

  const enviar = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorServidor([]);
    const limpio = validar();
    if (!limpio) return;
    setEnviando(true);
    try {
      await onGuardar({ nombre: limpio, descripcion: descripcion.trim() || null });
    } catch (error) {
      const e = normalizarError(error);
      setErrorServidor(e.detalles?.length ? e.detalles : [e.mensaje]);
    } finally {
      setEnviando(false);
    }
  };

  const mensajes = [errores.nombre, errores.descripcion].filter((m): m is string => Boolean(m));

  return (
    <form
      aria-labelledby="formulario-elemento-titulo"
      className={styles.formulario}
      noValidate
      onSubmit={(e) => void enviar(e)}
    >
      <h2 id="formulario-elemento-titulo" ref={tituloRef} tabIndex={-1}>
        {editando ? `Editar ${singular}: ${inicial?.nombre}` : `Nuevo ${singular}`}
      </h2>
      <ResumenErrores mensajes={errorServidor.length ? errorServidor : mensajes} titulo="Revisa estos datos" />
      <CampoTexto
        autoComplete="off"
        error={errores.nombre}
        etiqueta="Nombre"
        maxLength={nombreMax}
        onChange={(e) => setNombre(e.target.value)}
        required
        value={nombre}
      />
      {conDescripcion ? (
        <div className={estilosFormulario.campo}>
          <label className={estilosFormulario.etiqueta} htmlFor={idDescripcion}>
            Descripción (opcional)
          </label>
          <textarea
            aria-describedby={errores.descripcion ? `${idDescripcion}-error` : undefined}
            aria-invalid={errores.descripcion ? true : undefined}
            className={`${estilosFormulario.control} ${styles.area}`}
            id={idDescripcion}
            maxLength={DESCRIPCION_MAX}
            onChange={(e) => setDescripcion(e.target.value)}
            rows={3}
            value={descripcion}
          />
          {errores.descripcion ? (
            <p className={estilosFormulario.error} id={`${idDescripcion}-error`}>
              {errores.descripcion}
            </p>
          ) : null}
        </div>
      ) : null}
      <div className={styles.acciones}>
        <Boton disabled={enviando} icono={Save} type="submit">
          {enviando ? 'Guardando…' : 'Guardar'}
        </Boton>
        <button className={styles.secundario} onClick={onCancelar} type="button">
          <X aria-hidden="true" size={18} /> Cancelar
        </button>
      </div>
    </form>
  );
}
