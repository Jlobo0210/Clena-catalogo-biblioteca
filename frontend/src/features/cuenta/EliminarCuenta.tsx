import { useId, useState, type FormEvent } from 'react';
import { Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { normalizarError } from '../../api/errores';
import { RUTAS } from '../../config/rutas';
import { Boton } from '../../shared/ui/Boton';
import { eliminarCuenta } from '../auth/api/auth.api';
import { CampoTexto } from '../auth/components/CampoTexto';
import formulario from '../auth/components/Formulario.module.css';
import { ResumenErrores } from '../auth/components/ResumenErrores';
import { useSesion } from '../auth/sesion/contextoSesion';
import { AVISO_CUENTA_ELIMINADA } from './avisos';
import styles from './EliminarCuenta.module.css';

/**
 * HU-34 (Ley 1581 de 2012): la persona elimina su cuenta desde Mi cuenta.
 * Primero se explica qué pasa; el formulario pide la contraseña y una casilla de confirmación.
 */
export function EliminarCuenta() {
  const { salir, usuario } = useSesion();
  const navigate = useNavigate();
  const idCasilla = useId();
  const [abierto, setAbierto] = useState(false);
  const [password, setPassword] = useState('');
  const [entiendo, setEntiendo] = useState(false);
  const [errores, setErrores] = useState<string[]>([]);
  const [enviando, setEnviando] = useState(false);

  if (!usuario) return null;
  const esAdministrador = usuario.rol === 'ADMINISTRADOR';

  const enviar = async (evento: FormEvent) => {
    evento.preventDefault();
    const faltan: string[] = [];
    if (!password) faltan.push('Escribe tu contraseña para confirmar.');
    if (!entiendo) faltan.push('Marca la casilla para confirmar que entiendes que no se puede deshacer.');
    setErrores(faltan);
    if (faltan.length > 0) return;

    setEnviando(true);
    try {
      await eliminarCuenta(password);
      await salir();
      navigate(RUTAS.inicio, { replace: true, state: { aviso: AVISO_CUENTA_ELIMINADA } });
    } catch (error) {
      setErrores([normalizarError(error).mensaje]);
      setEnviando(false);
    }
  };

  return (
    <section aria-labelledby="eliminar-titulo" className={styles.seccion}>
      <h2 id="eliminar-titulo">Eliminar mi cuenta</h2>
      <p>
        Según la Ley 1581 de 2012 puedes pedir que borremos tus datos personales. Si eliminas tu
        cuenta:
      </p>
      <ul>
        <li>Borramos tu nombre, tu correo y tu contraseña, y se cierran tus sesiones.</li>
        <li>
          Tus préstamos pasados quedan en el historial de la biblioteca, pero sin datos que te
          identifiquen.
        </li>
        <li>No se puede deshacer. Para volver a usar el sistema tendrías que registrarte de nuevo.</li>
        <li>Primero debes devolver los libros que tengas prestados.</li>
      </ul>

      {esAdministrador ? (
        <p className={styles.nota}>
          Una cuenta de administración no se puede eliminar desde aquí. Pide a otro administrador
          que te cambie el rol primero.
        </p>
      ) : !abierto ? (
        <Boton className={styles.peligro} icono={Trash2} onClick={() => setAbierto(true)} variante="oscuro">
          Quiero eliminar mi cuenta
        </Boton>
      ) : (
        <form className={formulario.formulario} noValidate onSubmit={(e) => void enviar(e)}>
          <ResumenErrores mensajes={errores} titulo="No se pudo eliminar la cuenta" />
          <CampoTexto
            autoComplete="current-password"
            etiqueta="Tu contraseña"
            ayuda="La pedimos para confirmar que eres tú."
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            value={password}
          />
          <div className={formulario.campo}>
            <label className={formulario.casilla} htmlFor={idCasilla}>
              <input
                checked={entiendo}
                id={idCasilla}
                onChange={(e) => setEntiendo(e.target.checked)}
                type="checkbox"
              />
              <span>Entiendo que mi cuenta se elimina para siempre.</span>
            </label>
          </div>
          <div className={styles.acciones}>
            <Boton className={styles.peligro} disabled={enviando} icono={Trash2} type="submit" variante="oscuro">
              {enviando ? 'Eliminando…' : 'Eliminar mi cuenta para siempre'}
            </Boton>
            <Boton
              className={styles.cancelar}
              disabled={enviando}
              onClick={() => {
                setAbierto(false);
                setPassword('');
                setEntiendo(false);
                setErrores([]);
              }}
              variante="oscuro"
            >
              Cancelar
            </Boton>
          </div>
        </form>
      )}
    </section>
  );
}
