import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach } from 'vitest';
import { CLAVE_TUTORIAL } from '../features/tutorial/tutorialVisto';

beforeEach(() => {
  // El tutorial de la primera búsqueda (HU-32) se da por visto, salvo en sus propias pruebas.
  localStorage.setItem(CLAVE_TUTORIAL, 'si');
});

afterEach(() => {
  cleanup();
  sessionStorage.clear();
  localStorage.clear();
});
