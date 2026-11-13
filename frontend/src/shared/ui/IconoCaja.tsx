import type { LucideIcon } from 'lucide-react';
import styles from './IconoCaja.module.css';

interface IconoCajaProps {
  icono: LucideIcon;
  className?: string;
}

export function IconoCaja({ className = '', icono: Icono }: IconoCajaProps) {
  return (
    <span className={`${styles.caja} ${className}`}>
      <Icono aria-hidden="true" size={28} />
    </span>
  );
}
