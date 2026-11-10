import { BrowserRouter } from 'react-router-dom';
import { SesionProvider } from '../features/auth/sesion/SesionProvider';
import { RutasApp } from './RutasApp';

export default function App() {
  return (
    <BrowserRouter>
      <SesionProvider>
        <RutasApp />
      </SesionProvider>
    </BrowserRouter>
  );
}
