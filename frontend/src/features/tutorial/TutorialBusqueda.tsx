import { useEffect, useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Check, X } from 'lucide-react';
import { Boton } from '../../shared/ui/Boton';
import { PASOS_TUTORIAL } from './pasos';
import styles from './TutorialBusqueda.module.css';

interface TutorialBusquedaProps {
  /** Se llama al terminar, al saltarlo o al cerrarlo con Escape. */
  onCerrar: (motivo: 'terminado' | 'saltado') => void;
}

const SELECTOR_ENFOCABLES =
  'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * HU-32: tutorial guiado de la primera búsqueda.
 * Diálogo modal accesible: título enfocado al abrir y en cada paso, el foco no
 * sale del diálogo con Tab y Escape lo cierra.
 */
export function TutorialBusqueda({ onCerrar }: TutorialBusquedaProps) {
  const [indice, setIndice] = useState(0);
  const tituloRef = useRef<HTMLHeadingElement>(null);
  const dialogoRef = useRef<HTMLDivElement>(null);

  const paso = PASOS_TUTORIAL[indice];
  const esUltimo = indice === PASOS_TUTORIAL.length - 1;
  const Icono = paso.icono;

  useEffect(() => {
    tituloRef.current?.focus();
  }, [indice]);

  // Escape cierra y Tab no sale del diálogo (listener en document para no
  // poner eventos de teclado en un elemento no interactivo).
  useEffect(() => {
    function manejarTeclado(evento: KeyboardEvent) {
      if (evento.key === 'Escape') {
        evento.preventDefault();
        onCerrar('saltado');
        return;
      }
      if (evento.key !== 'Tab' || !dialogoRef.current) return;

      const enfocables = Array.from(
        dialogoRef.current.querySelectorAll<HTMLElement>(SELECTOR_ENFOCABLES),
      );
      if (enfocables.length === 0) return;
      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      const activo = document.activeElement;
      const dentro = dialogoRef.current.contains(activo);

      if (evento.shiftKey && (activo === primero || !dentro)) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && (activo === ultimo || !dentro)) {
        evento.preventDefault();
        primero.focus();
      }
    }
    document.addEventListener('keydown', manejarTeclado);
    return () => document.removeEventListener('keydown', manejarTeclado);
  }, [onCerrar]);

  return (
    <div className={styles.fondo}>
      <div
        aria-describedby="tutorial-texto"
        aria-labelledby="tutorial-titulo"
        aria-modal="true"
        className={styles.dialogo}
        ref={dialogoRef}
        role="dialog"
      >
        <button
          aria-label="Cerrar tutorial"
          className={styles.cerrar}
          onClick={() => onCerrar('saltado')}
          type="button"
        >
          <X aria-hidden="true" size={22} />
        </button>

        <p className={styles.progreso}>
          Paso {indice + 1} de {PASOS_TUTORIAL.length}
        </p>
        <span aria-hidden="true" className={styles.icono}>
          <Icono size={32} />
        </span>
        <h2 className={styles.titulo} id="tutorial-titulo" ref={tituloRef} tabIndex={-1}>
          {paso.titulo}
        </h2>
        <p className={styles.texto} id="tutorial-texto">
          {paso.texto}
        </p>
        <p className={styles.ejemplo}>{paso.ejemplo}</p>

        <ol aria-hidden="true" className={styles.puntos}>
          {PASOS_TUTORIAL.map((p, i) => (
            <li className={i === indice ? styles.puntoActivo : styles.punto} key={p.titulo} />
          ))}
        </ol>

        <div className={styles.acciones}>
          {indice > 0 ? (
            <Boton icono={ArrowLeft} onClick={() => setIndice(indice - 1)} className={styles.secundario} variante="oscuro">
              Anterior
            </Boton>
          ) : (
            <Boton onClick={() => onCerrar('saltado')} className={styles.secundario} variante="oscuro">
              Saltar tutorial
            </Boton>
          )}
          {esUltimo ? (
            <Boton icono={Check} onClick={() => onCerrar('terminado')}>
              Empezar a buscar
            </Boton>
          ) : (
            <Boton icono={ArrowRight} onClick={() => setIndice(indice + 1)}>
              Siguiente
            </Boton>
          )}
        </div>
      </div>
    </div>
  );
}
