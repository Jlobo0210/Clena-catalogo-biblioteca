import {
  actualizarAutor,
  crearAutor,
  eliminarAutor,
  listarAutores,
} from './api/catalogo-admin.api';
import { GestionCatalogo } from './components/GestionCatalogo';

/** HU-25: el personal gestiona los autores del catálogo. */
export function AutoresPage() {
  return (
    <GestionCatalogo
      actualizar={(id, { nombre }) => actualizarAutor(id, { nombre })}
      crear={({ nombre }) => crearAutor({ nombre })}
      eliminar={eliminarAutor}
      introduccion="Autores que se pueden asociar a los libros. Un autor con libros no se puede eliminar."
      listar={listarAutores}
      nombreMax={200}
      singular="autor"
      titulo="Autores"
    />
  );
}
