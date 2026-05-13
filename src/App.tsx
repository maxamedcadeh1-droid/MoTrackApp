import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { ToastProvider } from './components/ui/ToastProvider';
import { ModalProvider } from './components/ui/ModalContext';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { AppEntryExperience } from './components/AppEntryExperience';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';
import { RouteRefreshGuard } from './components/RouteRefreshGuard';
import { router } from './router';

export default function App() {
  return (
    <AuthProvider>
      <GlobalErrorBoundary>
        <AppEntryExperience />
        <ModalProvider>
          <ToastProvider>
            <PWAInstallPrompt />
            <RouteRefreshGuard />
            <RouterProvider router={router} />
          </ToastProvider>
        </ModalProvider>
      </GlobalErrorBoundary>
    </AuthProvider>
  );
}
