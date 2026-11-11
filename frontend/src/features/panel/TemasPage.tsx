import {
  actualizarTema,
  crearTema,
  eliminarTema,
  listarTemasPaginados,
} from './api/catalogo-admin.api';
import { GestionCatalogo } from './components/GestionCatalogo';

/** HU-25: el personal gestiona los temas con los que se clasifican los libros. */
export function TemasPage() {
  return (
    <GestionCatalogo
      actualizar={actualizarTema}
      conDescripcion
      conTotalLibros
      crear={crearTema}
      eliminar={eliminarTema}
      introduccion="Temas para clasificar los libros y explorar el catálogo. Un tema con libros no se puede eliminar."
      listar={listarTemasPaginados}
      nombreMax={120}
      singular="tema"
      titulo="Temas"
    />
  );
}
