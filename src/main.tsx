import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

async function start() {
  // Una instalación anterior puede seguir interceptando Vite aunque ya no
  // registremos el worker en desarrollo. Liberamos esta app antes de renderizar.
  if (import.meta.env.DEV && 'serviceWorker' in navigator) {
    const scope = new URL(import.meta.env.BASE_URL, location.href).href;
    const registrations = await navigator.serviceWorker.getRegistrations();
    const ownRegistrations = registrations.filter((registration) => registration.scope === scope);
    const controlled = navigator.serviceWorker.controller !== null;
    await Promise.all(ownRegistrations.map((registration) => registration.unregister()));
    if (controlled && ownRegistrations.length > 0) {
      location.reload();
      return;
    }
  }

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

void start();

// En desarrollo no se registra para evitar servir archivos viejos desde la caché.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* sin service worker la app funciona igual, sólo no se puede instalar */
    });
  });
}
