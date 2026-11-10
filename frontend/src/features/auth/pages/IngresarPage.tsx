import { useState, type FormEvent } from 'react';
import { LogIn } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { normalizarError } from '../../../api/errores';
import { RUTAS } from '../../../config/rutas';
import { Boton } from '../../../shared/ui/Boton';
import { CampoTexto } from '../components/CampoTexto';
import styles from '../components/Formulario.module.css';
import { ResumenErrores } from '../components/ResumenErrores';
import { destinoTrasIngreso } from '../destinoTrasIngreso';
import { useSesion } from '../sesion/contextoSesion';
import { validarIngreso, type FormularioIngreso } from '../validacion';

export function IngresarPage() {
  const { ingresar, usuario } = useSesion();
  const navigate = useNavigate();
  const location = useLocation();
  const desde = (location.state as { desde?: unknown } | null)?.desde;

  const [datos, setDatos] = useState<FormularioIngreso>({ email: '', password: '' });
  const [errores, setErrores] = useState<Partial<Record<keyof FormularioIngreso, string>>>({});
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  if (usuario && !enviando) {
    return <Navigate replace to={destinoTrasIngreso(usuario, desde)} />;
  }

  const cambiar = (campo: keyof FormularioIngreso) => (valor: string) =>
    setDatos((actual) => ({ ...actual, [campo]: valor }));

  const enviar = async (evento: FormEvent<HTMLFormElement>) => {
    evento.preventDefault();
    const nuevosErrores = validarIngreso(datos);
    setErrores(nuevosErrores);
    setErrorGeneral(null);
    if (Object.keys(nuevosErrores).length > 0) return;

    setEnviando(true);
    try {
      const usuarioIngresado = await ingresar({ email: datos.email.trim(), password: datos.password });
      navigate(destinoTrasIngreso(usuarioIngresado, desde), { replace: true });
    } catch (error) {
      const e = normalizarError(error);
      setErrorGeneral(
        e.tipo === 'no-autenticado'
          ? 'El correo o la contraseña no son correctos. Revísalos e inténtalo de nuevo.'
          : e.mensaje,
      );
      setEnviando(false);
    }
  };

  const mensajes = errorGeneral ? [errorGeneral] : Object.values(errores).filter((m): m is string => Boolean(m));

  return (
    <section aria-labelledby="ingresar-titulo" className={styles.pagina}>
      <div className={styles.tarjeta}>
        <h1 id="ingresar-titulo">Iniciar sesión</h1>
        <p className={styles.introduccion}>
          Entra con tu cuenta para ver tus préstamos y recibir avisos. Para buscar libros no necesitas cuenta.
        </p>

        <ResumenErrores mensajes={mensajes} titulo="No pudimos iniciar tu sesión" />

        <form aria-busy={enviando} className={styles.formulario} noValidate onSubmit={enviar}>
          <CampoTexto
            autoComplete="username"
            error={errores.email}
            etiqueta="Correo electrónico"
            inputMode="email"
            onChange={(e) => cambiar('email')(e.target.value)}
            required
            type="email"
            value={datos.email}
          />
          <CampoTexto
            autoComplete="current-password"
            error={errores.password}
            etiqueta="Contraseña"
            onChange={(e) => cambiar('password')(e.target.value)}
            required
            type="password"
            value={datos.password}
          />
          <Boton className={styles.enviar} disabled={enviando} icono={LogIn} tamano="grande" type="submit" variante="oscuro">
            {enviando ? 'Ingresando…' : 'Iniciar sesión'}
          </Boton>
        </form>

        <p className={styles.pie}>
          ¿No tienes cuenta? <Link to={RUTAS.registro}>Crear una cuenta</Link>
        </p>
      </div>
    </section>
  );
}
