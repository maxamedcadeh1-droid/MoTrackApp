import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const DEV_SERVICE_WORKER_RELOAD_KEY = 'motrack-dev-service-worker-cleaned';

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    sessionStorage.removeItem(DEV_SERVICE_WORKER_RELOAD_KEY);

    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('MoTrack SW registered:', registration.scope);
        })
        .catch((error) => {
          console.log('MoTrack SW registration failed:', error);
        });
    });
  } else {
    navigator.serviceWorker.getRegistrations()
      .then(async (registrations) => {
        const hadServiceWorker = registrations.length > 0 || Boolean(navigator.serviceWorker.controller);

        await Promise.all(registrations.map((registration) => registration.unregister()));

        // Avoid forced full page reloads/state resets during navigation.
        // We still mark that cleanup ran so we don't loop.
        if (hadServiceWorker && sessionStorage.getItem(DEV_SERVICE_WORKER_RELOAD_KEY) !== 'true') {
          sessionStorage.setItem(DEV_SERVICE_WORKER_RELOAD_KEY, 'true');
          return;
        }

        if (!navigator.serviceWorker.controller) {
          sessionStorage.removeItem(DEV_SERVICE_WORKER_RELOAD_KEY);
        }
      })
      .catch((error) => {
        console.log('MoTrack SW cleanup failed:', error);
      });
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
