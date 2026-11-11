import { Route, Routes } from 'react-router-dom';
import { RUTAS } from '../config/rutas';
import { AppLayout } from './layout/AppLayout';
import { PaginaPendiente } from '../shared/components/PaginaPendiente';
import { NoEncontradaPage } from '../shared/components/NoEncontradaPage';
import { InicioPage } from '../features/inicio/InicioPage';
import { BusquedaPage } from '../features/busqueda/BusquedaPage';
import { RutaProtegida } from '../features/auth/components/RutaProtegida';
import { IngresarPage } from '../features/auth/pages/IngresarPage';
import { RegistroPage } from '../features/auth/pages/RegistroPage';
import { MiCuentaPage } from '../features/cuenta/MiCuentaPage';
import { PanelPage } from '../features/panel/PanelPage';
import { MisPrestamosPage } from '../features/prestamos/MisPrestamosPage';
import { PrestamosPersonalPage } from '../features/prestamos/PrestamosPersonalPage';
import { AutoresPage } from '../features/panel/AutoresPage';
import { TemasPage } from '../features/panel/TemasPage';
import { ImportarPage } from '../features/panel/ImportarPage';
import { LibrosPanelPage } from '../features/panel/LibrosPanelPage';
import { LibroPanelPage } from '../features/panel/LibroPanelPage';
import { UsuariosPage } from '../features/administracion/UsuariosPage';
import { ExplorarPage } from '../features/temas/ExplorarPage';
import { DetalleLibroPage } from '../features/catalogo/DetalleLibroPage';

export function RutasApp() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path={RUTAS.inicio} element={<InicioPage />} />
        <Route path={RUTAS.buscar} element={<BusquedaPage />} />
        <Route path={RUTAS.libro} element={<DetalleLibroPage />} />
        <Route
          path={RUTAS.busquedaAvanzada}
          element={<PaginaPendiente titulo="Búsqueda avanzada" />}
        />
        <Route path={RUTAS.temas} element={<ExplorarPage />} />
        <Route path={RUTAS.ingresar} element={<IngresarPage />} />
        <Route path={RUTAS.registro} element={<RegistroPage />} />

        {/* Cualquier persona con sesión iniciada */}
        <Route element={<RutaProtegida />}>
          <Route path={RUTAS.miCuenta} element={<MiCuentaPage />} />
          <Route path={RUTAS.misPrestamos} element={<MisPrestamosPage />} />
        </Route>

        {/* Personal del CLENA y administración (HU-13) */}
        <Route element={<RutaProtegida roles={['PERSONAL', 'ADMINISTRADOR']} />}>
          <Route path={RUTAS.panel} element={<PanelPage />} />
          <Route path={RUTAS.prestamosPersonal} element={<PrestamosPersonalPage />} />
          <Route path={RUTAS.panelAutores} element={<AutoresPage />} />
          <Route path={RUTAS.panelTemas} element={<TemasPage />} />
          <Route path={RUTAS.panelImportar} element={<ImportarPage />} />
          <Route path={RUTAS.panelLibros} element={<LibrosPanelPage />} />
          <Route path={RUTAS.panelLibroNuevo} element={<LibroPanelPage />} />
          <Route path={RUTAS.panelLibro} element={<LibroPanelPage />} />
        </Route>

        {/* Solo administración */}
        <Route element={<RutaProtegida roles={['ADMINISTRADOR']} />}>
          <Route path={RUTAS.usuarios} element={<UsuariosPage />} />
        </Route>

        <Route path="*" element={<NoEncontradaPage />} />
      </Route>
    </Routes>
  );
}
