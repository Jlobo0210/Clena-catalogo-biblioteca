import { useEffect, useId, useState, type FormEvent } from 'react';
import { UserPlus } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { normalizarError } from '../../../api/errores';
import { RUTAS } from '../../../config/rutas';
import { Boton } from '../../../shared/ui/Boton';
import { obtenerAvisoPrivacidad } from '../api/auth.api';
import { AvisoPrivacidad } from '../components/AvisoPrivacidad';
import { CampoTexto } from '../components/CampoTexto';
import styles from '../components/Formulario.module.css';
import { ResumenErrores } from '../components/ResumenErrores';
import { destinoTrasIngreso } from '../destinoTrasIngreso';
import { useSesion } from '../sesion/contextoSesion';
import type { AvisoPrivacidad as Aviso } from '../types';
import {
  REGLA_CONTRASENA,
  validarRegistro,
  type ErroresRegistro,
  type FormularioRegistro,
} from '../validacion';

const VACIO: FormularioRegistro = { nombre: '', email: '', password: '', confirmacion: '', aceptaAviso: false };

export function RegistroPage() {
  const { registrarse, usuario } = useSesion();
  const navigate = useNavigate();
  const idCasillaError = useId();

  const [aviso, setAviso] = useState<Aviso | null>(null);
  const [errorAviso, setErrorAviso] = useState(false);
  const [datos, setDatos] = useState<FormularioRegistro>(VACIO);
  const [errores, setErrores] = useState<ErroresRegistro>({});
  const [errorGeneral, setErrorGeneral] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    let activo = true;
    obtenerAvisoPrivacidad()
      .then((a) => activo && setAviso(a))
      .catch(() => activo && setErrorAviso(true));
    return () => {
      activo = false;
    };
  }, []);

  if (usuario && !enviando) {
    return <Navigate replace to={destinoTrasIngreso(usuario)} />;
  }

  const cambiar = <K extends keyof FormularioRegistro>(campo: K, valor: FormularioRegistro[K]) =>
    setDatos((actual) => ({ ...actual, [campo]: valor }));

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const nuevosErrores = validarRegistro(datos);
    setErrores(nuevosErrores);
    setErrorGeneral([]);
    if (Object.keys(nuevosErrores).length > 0) return;

    setEnviando(true);
    try {
      const nuevo = await registrarse({
        nombre: datos.nombre.trim(),
        email: datos.email.trim(),
        password: datos.password,
        aceptaAvisoPrivacidad: true,
      });
      navigate(destinoTrasIngreso(nuevo), { replace: true });
    } catch (error) {
      const e = normalizarError(error);
      if (e.tipo === 'conflicto') {
        setErrores({ email: 'Ya existe una cuenta con este correo. Inicia sesión o usa otro correo.' });
      } else {
        setErrorGeneral(e.detalles?.length ? e.detalles : [e.mensaje]);
      }
      setEnviando(false);
    }
  };

  const mensajes = errorGeneral.length
    ? errorGeneral
    : Object.values(errores).filter((m): m is string => Boolean(m));

  return (
    <section aria-labelledby="registro-titulo" className={styles.pagina}>
      <div className={styles.tarjeta}>
        <h1 id="registro-titulo">Crear una cuenta</h1>
        <p className={styles.introduccion}>
          Con una cuenta puedes consultar tus préstamos y recibir avisos cuando un libro esté disponible.
        </p>

        <ResumenErrores mensajes={mensajes} titulo="Revisa estos datos" />

        <form aria-busy={enviando} className={styles.formulario} noValidate onSubmit={enviar}>
          <CampoTexto
            autoComplete="name"
            error={errores.nombre}
            etiqueta="Nombre completo"
            maxLength={120}
            onChange={(e) => cambiar('nombre', e.target.value)}
            required
            value={datos.nombre}
          />
          <CampoTexto
            autoComplete="email"
            error={errores.email}
            etiqueta="Correo electrónico"
            inputMode="email"
            onChange={(e) => cambiar('email', e.target.value)}
            required
            type="email"
            value={datos.email}
          />
          <CampoTexto
            autoComplete="new-password"
            ayuda={REGLA_CONTRASENA}
            error={errores.password}
            etiqueta="Contraseña"
            maxLength={72}
            onChange={(e) => cambiar('password', e.target.value)}
            required
            type="password"
            value={datos.password}
          />
          <CampoTexto
            autoComplete="new-password"
            error={errores.confirmacion}
            etiqueta="Repite la contraseña"
            maxLength={72}
            onChange={(e) => cambiar('confirmacion', e.target.value)}
            required
            type="password"
            value={datos.confirmacion}
          />

          {aviso ? <AvisoPrivacidad aviso={aviso} /> : null}
          {errorAviso ? (
            <p className={styles.error} role="alert">
              No pudimos cargar el aviso de privacidad. Revisa la conexión y recarga la página.
            </p>
          ) : null}
          {!aviso && !errorAviso ? <p role="status">Cargando el aviso de privacidad…</p> : null}

          <div className={styles.campo}>
            <label className={styles.casilla}>
              <input
                aria-describedby={errores.aceptaAviso ? idCasillaError : undefined}
                aria-invalid={errores.aceptaAviso ? true : undefined}
                checked={datos.aceptaAviso}
                disabled={!aviso}
                onChange={(e) => cambiar('aceptaAviso', e.target.checked)}
                required
                type="checkbox"
              />
              <span>He leído el aviso de privacidad y autorizo el tratamiento de mis datos.</span>
            </label>
            {errores.aceptaAviso ? (
              <p className={styles.error} id={idCasillaError}>
                {errores.aceptaAviso}
              </p>
            ) : null}
          </div>

          <Boton
            className={styles.enviar}
            disabled={enviando || !aviso}
            icono={UserPlus}
            tamano="grande"
            type="submit"
            variante="oscuro"
          >
            {enviando ? 'Creando la cuenta…' : 'Crear cuenta'}
          </Boton>
        </form>

        <p className={styles.pie}>
          ¿Ya tienes cuenta? <Link to={RUTAS.ingresar}>Iniciar sesión</Link>
        </p>
      </div>
    </section>
  );
}
