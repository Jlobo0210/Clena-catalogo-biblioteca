import { useId, useState, type InputHTMLAttributes } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import styles from './Formulario.module.css';

interface CampoTextoProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  etiqueta: string;
  error?: string;
  ayuda?: string;
}

/** Campo con etiqueta visible, ayuda y error asociados para lectores de pantalla. */
export function CampoTexto({ ayuda, error, etiqueta, type = 'text', ...props }: CampoTextoProps) {
  const id = useId();
  const idAyuda = `${id}-ayuda`;
  const idError = `${id}-error`;
  const [visible, setVisible] = useState(false);
  const esContrasena = type === 'password';
  const describedBy = [ayuda ? idAyuda : null, error ? idError : null].filter(Boolean).join(' ');

  return (
    <div className={styles.campo}>
      <label className={styles.etiqueta} htmlFor={id}>
        {etiqueta}
      </label>
      {ayuda ? (
        <p className={styles.ayuda} id={idAyuda}>
          {ayuda}
        </p>
      ) : null}
      <div className={styles.controlContenedor}>
        <input
          aria-describedby={describedBy || undefined}
          aria-invalid={error ? true : undefined}
          className={styles.control}
          id={id}
          type={esContrasena && visible ? 'text' : type}
          {...props}
        />
        {esContrasena ? (
          <button
            aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            aria-pressed={visible}
            className={styles.verContrasena}
            onClick={() => setVisible((v) => !v)}
            type="button"
          >
            {visible ? <EyeOff aria-hidden="true" size={22} /> : <Eye aria-hidden="true" size={22} />}
          </button>
        ) : null}
      </div>
      {error ? (
        <p className={styles.error} id={idError}>
          {error}
        </p>
      ) : null}
    </div>
  );
}
