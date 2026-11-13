import { Star } from 'lucide-react';
import styles from './MarcaBiblioteca.module.css';

export function MarcaBiblioteca() {
  return (
    <span className={styles.marca}>
      <Star aria-hidden="true" fill="currentColor" size={24} />
    </span>
  );
}
