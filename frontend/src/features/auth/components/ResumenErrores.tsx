import { useEffect, useRef } from 'react';
import { CircleAlert } from 'lucide-react';
import styles from './Formulario.module.css';

interface ResumenErroresProps {
  titulo: string;
  mensajes: string[];
}

/** Resumen de errores al inicio del formulario: recibe el foco para que se lea de inmediato. */
export function ResumenErrores({ mensajes, titulo }: ResumenErroresProps) {
  const ref = useRef<HTMLDivElement>(null);
  // El arreglo llega nuevo en cada render (por ejemplo, al teclear en un campo): se compara
  // el contenido para que el foco solo se mueva cuando aparece un error distinto.
  const contenido = mensajes.join('\n');

  useEffect(() => {
    if (contenido) ref.current?.focus();
  }, [contenido]);

  if (mensajes.length === 0) return null;

  return (
    <div className={styles.resumenErrores} ref={ref} role="alert" tabIndex={-1}>
      <p className={styles.resumenTitulo}>
        <CircleAlert aria-hidden="true" size={22} />
        {titulo}
      </p>
      {mensajes.length > 1 ? (
        <ul>
          {mensajes.map((m) => (
            <li key={m}>{m}</li>
          ))}
        </ul>
      ) : (
        <p>{mensajes[0]}</p>
      )}
    </div>
  );
}
