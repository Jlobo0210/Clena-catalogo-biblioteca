import { useState } from 'react';
import { ArrowLeft, ExternalLink, RotateCw } from 'lucide-react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { RUTAS, rutaLibro, rutaPanelLibro } from '../../config/rutas';
import { useConsulta } from '../../shared/hooks/useConsulta';
import { Boton } from '../../shared/ui/Boton';
import { obtenerLibro } from '../catalogo/api/libros.api';
import type { LibroDto } from '../catalogo/types';
import { actualizarLibro, crearLibro, type DatosLibro } from './api/catalogo-admin.api';
import { EjemplaresLibro } from './components/EjemplaresLibro';
import { FormularioLibro } from './components/FormularioLibro';
import estilos from './components/GestionCatalogo.module.css';

/** HU-25: registrar un libro nuevo o editar uno existente con sus ejemplares. */
export function LibroPanelPage() {
  const { id } = useParams<{ id: string }>();
  return id ? <EditarLibro id={id} key={id} /> : <NuevoLibro />;
}

function Encabezado({ titulo, children }: { titulo: string; children?: React.ReactNode }) {
  return (
    <>
      <Link className={estilos.volver} to={RUTAS.panelLibros}>
        <ArrowLeft aria-hidden="true" size={20} />
        Volver a los libros
      </Link>
      <header className={estilos.cabecera}>
        <div>
          <h1 id="libro-titulo">{titulo}</h1>
        </div>
        {children}
      </header>
    </>
  );
}

function NuevoLibro() {
  const navigate = useNavigate();

  const guardar = async (datos: DatosLibro) => {
    const libro = await crearLibro(datos);
    // Se pasa a la edición para poder agregar los ejemplares enseguida.
    navigate(rutaPanelLibro(libro.id), {
      replace: true,
      state: { aviso: `Libro «${libro.titulo}» registrado. Ahora puedes agregar sus ejemplares.` },
    });
  };

  return (
    <section aria-labelledby="libro-titulo" className={estilos.pagina}>
      <title>Nuevo libro · Panel · Consulta Fácil</title>
      <Encabezado titulo="Nuevo libro" />
      <FormularioLibro onGuardar={guardar} />
    </section>
  );
}

function EditarLibro({ id }: { id: string }) {
  const { state } = useLocation();
  const consulta = useConsulta(`libro|${id}`, (signal) => obtenerLibro(id, signal));
  const [guardado, setGuardado] = useState<LibroDto | null>(null);
  const [aviso, setAviso] = useState((state as { aviso?: string } | null)?.aviso ?? '');

  if (consulta.estado === 'cargando') {
    return (
      <section aria-busy="true" aria-labelledby="libro-titulo" className={estilos.pagina}>
        <Encabezado titulo="Editar libro" />
        <p role="status">Cargando el libro…</p>
      </section>
    );
  }

  if (consulta.estado === 'error') {
    return (
      <section aria-labelledby="libro-titulo" className={estilos.pagina}>
        <Encabezado titulo="Editar libro" />
        <div className={estilos.errorCarga} role="alert">
          <p>
            {consulta.error.tipo === 'no-encontrado' || consulta.error.tipo === 'validacion'
              ? 'No encontramos este libro. Puede que ya se haya eliminado.'
              : `No se pudo cargar el libro: ${consulta.error.mensaje}`}
          </p>
          {consulta.error.tipo === 'no-encontrado' || consulta.error.tipo === 'validacion' ? null : (
            <Boton icono={RotateCw} onClick={consulta.reintentar} variante="oscuro">
              Intentar de nuevo
            </Boton>
          )}
        </div>
      </section>
    );
  }

  const libro = guardado ?? consulta.datos;

  const guardar = async (datos: DatosLibro) => {
    const actualizado = await actualizarLibro(id, datos);
    setGuardado(actualizado);
    setAviso(`Cambios de «${actualizado.titulo}» guardados.`);
  };

  return (
    <section aria-labelledby="libro-titulo" className={estilos.pagina}>
      <title>{`${libro.titulo} · Panel · Consulta Fácil`}</title>
      <Encabezado titulo={`Editar: ${libro.titulo}`}>
        <Link className={estilos.secundario} to={rutaLibro(libro.id)}>
          <ExternalLink aria-hidden="true" size={18} /> Ver como visitante
        </Link>
      </Encabezado>
      <p aria-live="polite" className={estilos.aviso}>
        {aviso}
      </p>
      <FormularioLibro libro={libro} onGuardar={guardar} />
      {libro.formato === 'DIGITAL' ? (
        <p className={estilos.descripcion}>Este libro es solo digital: no tiene ejemplares físicos.</p>
      ) : (
        <EjemplaresLibro libroId={libro.id} />
      )}
    </section>
  );
}
