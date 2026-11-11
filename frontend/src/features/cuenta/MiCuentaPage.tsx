import { LogOut } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { RUTAS } from '../../config/rutas';
import { Boton } from '../../shared/ui/Boton';
import { useSesion } from '../auth/sesion/contextoSesion';
import { NOMBRE_ROL } from '../auth/types';
import styles from './MiCuentaPage.module.css';

const formatoFecha = new Intl.DateTimeFormat('es-CO', { dateStyle: 'long' });

export function MiCuentaPage() {
  const { salir, usuario } = useSesion();
  const navigate = useNavigate();
  if (!usuario) return null;

  const cerrar = async () => {
    await salir();
    navigate(RUTAS.inicio, { replace: true });
  };

  return (
    <section aria-labelledby="cuenta-titulo" className={styles.pagina}>
      <h1 id="cuenta-titulo">Mi cuenta</h1>
      <dl className={styles.datos}>
        <div>
          <dt>Nombre</dt>
          <dd>{usuario.nombre}</dd>
        </div>
        <div>
          <dt>Correo electrónico</dt>
          <dd>{usuario.email}</dd>
        </div>
        <div>
          <dt>Tipo de cuenta</dt>
          <dd>{NOMBRE_ROL[usuario.rol]}</dd>
        </div>
        <div>
          <dt>Aviso de privacidad aceptado</dt>
          <dd>
            Versión {usuario.versionAvisoPrivacidad}, el{' '}
            {formatoFecha.format(new Date(usuario.consentimientoPrivacidadEn))}
          </dd>
        </div>
      </dl>
      <p className={styles.nota}>
        <Link to={RUTAS.misPrestamos}>Ver mis préstamos y fechas de devolución</Link>
      </p>
      <Boton icono={LogOut} onClick={() => void cerrar()} variante="oscuro">
        Cerrar sesión
      </Boton>
    </section>
  );
}
