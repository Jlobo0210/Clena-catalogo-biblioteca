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

  useEffect(() => {
    if (mensajes.length > 0) ref.current?.focus();
  }, [mensajes]);

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
