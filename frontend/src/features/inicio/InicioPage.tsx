import { useEffect, useRef } from 'react';
import { CircleCheck } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useTotalLibros } from '../catalogo/hooks/useTotalLibros';
import { AgendaCultural } from './components/AgendaCultural';
import { BannerAyuda } from './components/BannerAyuda';
import { PortadaBusqueda } from './components/PortadaBusqueda';
import { ServiciosSala } from './components/ServiciosSala';
import styles from './InicioPage.module.css';

export function InicioPage() {
  const { total } = useTotalLibros();
  // Aviso que llega al navegar, p. ej. después de eliminar la cuenta (HU-34).
  const aviso = (useLocation().state as { aviso?: string } | null)?.aviso;
  const avisoRef = useRef<HTMLParagraphElement>(null);
  // Al llegar con un aviso, se muestra arriba y recibe el foco para que se lea.
  useEffect(() => {
    if (!aviso) return;
    window.scrollTo?.(0, 0);
    avisoRef.current?.focus();
  }, [aviso]);

  return (
    <>
      <title>Inicio · Consulta Fácil</title>
      <div className={styles.inicio}>
        {aviso ? (
          <p className={styles.aviso} ref={avisoRef} role="status" tabIndex={-1}>
            <CircleCheck aria-hidden="true" size={22} />
            {aviso}
          </p>
        ) : null}
        <PortadaBusqueda totalLibros={total} />
        <AgendaCultural />
        <ServiciosSala />
        <BannerAyuda />
      </div>
    </>
  );
}
