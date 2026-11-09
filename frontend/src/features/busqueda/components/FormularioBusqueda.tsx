import { useRef, useState, type FormEvent } from 'react';
import { ChevronDown, CircleAlert, Layers, Search, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AMBITOS, esAmbitoId, type AmbitoId } from '../ambitos';
import { construirUrlBusqueda } from '../parametrosBusqueda';
import { Boton } from '../../../shared/ui/Boton';
import styles from './FormularioBusqueda.module.css';

export function FormularioBusqueda() {
  const navigate = useNavigate();
  const campoRef = useRef<HTMLInputElement>(null);
  const [texto, setTexto] = useState('');
  const [ambito, setAmbito] = useState<AmbitoId>('todo');
  const [mostrarError, setMostrarError] = useState(false);

  const enviar = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const textoNormalizado = texto.trim().replace(/\s+/g, ' ');

    if (!textoNormalizado) {
      setMostrarError(true);
      campoRef.current?.focus();
      return;
    }

    navigate(construirUrlBusqueda({ ambito, q: textoNormalizado }));
  };

  const limpiar = () => {
    setTexto('');
    setMostrarError(false);
    campoRef.current?.focus();
  };

  return (
    <form className={styles.formulario} noValidate onSubmit={enviar} role="search">
      <div className={styles.barra}>
        <div className={styles.selectorContenedor}>
          <label className="visualmente-oculto" htmlFor="ambito-busqueda">
            Ámbito de búsqueda
          </label>
          <Layers aria-hidden="true" className={styles.iconoSelector} size={20} />
          <select
            className={styles.selector}
            id="ambito-busqueda"
            onChange={(event) => {
              const nuevoAmbito = event.target.value;
              if (esAmbitoId(nuevoAmbito)) {
                setAmbito(nuevoAmbito);
              }
            }}
            value={ambito}
          >
            {AMBITOS.map((opcion) => (
              <option key={opcion.id} value={opcion.id}>
                {opcion.etiqueta}
              </option>
            ))}
          </select>
          <ChevronDown aria-hidden="true" className={styles.flecha} size={20} />
        </div>

        <div className={styles.campoContenedor}>
          <label className="visualmente-oculto" htmlFor="texto-busqueda">
            Buscar en el catálogo
          </label>
          <Search aria-hidden="true" className={styles.iconoCampo} size={22} />
          <input
            ref={campoRef}
            aria-describedby={mostrarError ? 'error-busqueda' : undefined}
            aria-invalid={mostrarError}
            autoComplete="off"
            className={styles.campo}
            enterKeyHint="search"
            id="texto-busqueda"
            maxLength={100}
            onChange={(event) => {
              setTexto(event.target.value);
              if (mostrarError) {
                setMostrarError(false);
              }
            }}
            placeholder="Título, autor, materia o palabra clave"
            type="search"
            value={texto}
          />
        </div>

        <Boton
          className={styles.limpiar}
          icono={X}
          onClick={limpiar}
          type="button"
          variante="translucido"
        >
          Limpiar
        </Boton>
        <Boton icono={Search} tamano="grande" type="submit">
          Buscar en catálogo
        </Boton>
      </div>
      {mostrarError ? (
        <p className={styles.error} id="error-busqueda" role="alert">
          <CircleAlert aria-hidden="true" size={20} />
          Escriba un título, un autor o un tema para buscar.
        </p>
      ) : null}
    </form>
  );
}
