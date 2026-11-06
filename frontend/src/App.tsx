import { useEffect, useState } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { apiClient } from './api/apiClient';
import { MainLayout } from './components/MainLayout';

function HealthPage() {
  const [health, setHealth] = useState<string>('Consultando el estado de la API...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    apiClient
      .get<unknown>('/health')
      .then((response) => {
        if (isMounted) {
          setHealth(JSON.stringify(response.data));
        }
      })
      .catch(() => {
        if (isMounted) {
          setError('No fue posible consultar el estado de la API.');
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section aria-labelledby="welcome-title">
      <h1 id="welcome-title">Catálogo de biblioteca</h1>
      {error ? <p role="alert">{error}</p> : <p>Estado de la API: {health}</p>}
    </section>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HealthPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
