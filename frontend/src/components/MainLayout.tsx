import { NavLink, Outlet } from 'react-router-dom';

export function MainLayout() {
  return (
    <>
      <a className="skip-link" href="#main-content">
        Ir al contenido principal
      </a>
      <header className="site-header">
        <div className="site-header__inner">
          <p className="site-title">Catálogo de biblioteca</p>
          <nav aria-label="Navegación principal">
            <ul className="navigation-list">
              <li>
                <NavLink className="navigation-link" to="/" end>
                  Inicio
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      <main className="site-main" id="main-content">
        <Outlet />
      </main>
      <footer className="site-footer">
        <p>Catálogo de biblioteca</p>
      </footer>
    </>
  );
}
