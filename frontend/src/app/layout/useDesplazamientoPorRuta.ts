import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function useDesplazamientoPorRuta() {
  const { hash, pathname } = useLocation();

  useEffect(() => {
    if (hash) {
      const elemento = document.getElementById(hash.slice(1));
      elemento?.scrollIntoView({
        behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
          ? 'auto'
          : 'smooth',
      });
      elemento?.focus({ preventScroll: true });
      return;
    }

    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [hash, pathname]);
}
