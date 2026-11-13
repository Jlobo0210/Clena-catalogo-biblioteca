import type { ButtonHTMLAttributes, Ref } from 'react';
import type { LucideIcon } from 'lucide-react';
import styles from './Boton.module.css';

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: 'primario' | 'oscuro' | 'translucido';
  tamano?: 'normal' | 'grande';
  icono?: LucideIcon;
  /** React 19: el ref llega como prop y se pasa al <button>. */
  ref?: Ref<HTMLButtonElement>;
}

export function Boton({
  children,
  className = '',
  icono: Icono,
  tamano = 'normal',
  type = 'button',
  variante = 'primario',
  ...props
}: BotonProps) {
  const clases = [styles.boton, styles[variante], styles[tamano], className]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={clases} type={type} {...props}>
      {Icono ? <Icono aria-hidden="true" size={20} /> : null}
      <span>{children}</span>
    </button>
  );
}
