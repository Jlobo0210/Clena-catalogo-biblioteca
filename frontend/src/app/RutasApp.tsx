import { Route, Routes } from 'react-router-dom';
import { RUTAS } from '../config/rutas';
import { AppLayout } from './layout/AppLayout';
import { PaginaPendiente } from '../shared/components/PaginaPendiente';
import { NoEncontradaPage } from '../shared/components/NoEncontradaPage';
import { InicioPage } from '../features/inicio/InicioPage';
import { BusquedaPage } from '../features/busqueda/BusquedaPage';

export function RutasApp() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={RUTAS.inicio} element={<InicioPage />} />
        <Route path={RUTAS.buscar} element={<BusquedaPage />} />
        <Route
          path={RUTAS.busquedaAvanzada}
          element={<PaginaPendiente titulo="Búsqueda avanzada" />}
        />
        <Route
          path={RUTAS.temas}
          element={<PaginaPendiente titulo="Explorar por tema" />}
        />
        <Route path="*" element={<NoEncontradaPage />} />
      </Route>
    </Routes>
  );
}
