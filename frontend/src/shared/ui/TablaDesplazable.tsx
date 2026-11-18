import { useEffect, useRef, useState, type ReactNode } from 'react';

interface TablaDesplazableProps {
  /** Nombre de la región para lectores de pantalla, p. ej. «Préstamos sin devolver». */
  etiqueta: string;
  className?: string;
  children: ReactNode;
}

/**
 * HU-33: contenedor de una tabla ancha. En pantallas angostas la tabla se desplaza sola
 * (sin ensanchar la página, WCAG 1.4.10) y, solo cuando de verdad se desplaza, el contenedor
 * recibe el foco para que se pueda mover con las flechas del teclado (WCAG 2.1.1).
 */
export function TablaDesplazable({ children, className, etiqueta }: TablaDesplazableProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [desplazable, setDesplazable] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const medir = () => setDesplazable(el.scrollWidth > el.clientWidth + 1);
    medir();
    if (typeof ResizeObserver === 'undefined') return;
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    if (el.firstElementChild) observador.observe(el.firstElementChild);
    return () => observador.disconnect();
  }, []);

  return (
    <div
      aria-label={desplazable ? `${etiqueta} (desplácese horizontalmente para ver todo)` : undefined}
      className={className}
      ref={ref}
      role={desplazable ? 'region' : undefined}
       
      tabIndex={desplazable ? 0 : undefined}
    >
      {children}
    </div>
  );
}
