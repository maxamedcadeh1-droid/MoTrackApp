import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider } from './features/auth/AuthContext';
import { ProtectedRoute, PublicRoute } from './features/auth/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { ToastProvider } from './components/ui/ToastProvider';
import { ModalProvider } from './components/ui/ModalContext';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { AppEntryExperience, PremiumRouteLoader } from './components/AppEntryExperience';
import { GlobalErrorBoundary } from './components/GlobalErrorBoundary';

// Auth Pages
import { LoginForm } from './features/auth/LoginForm';
import { SignUpForm } from './features/auth/SignUpForm';
import { ForgotPasswordForm } from './features/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './features/auth/ResetPasswordForm';

// Lazy-loaded Dashboard Pages for code splitting
const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then(m => ({ default: m.Dashboard })));
const Habits = lazy(() => import('./features/habits/Habits').then(m => ({ default: m.Habits })));
const Notes = lazy(() => import('./features/notes/Notes').then(m => ({ default: m.Notes })));
const Projects = lazy(() => import('./features/projects/Projects').then(m => ({ default: m.Projects })));
const Focus = lazy(() => import('./features/focus/Focus').then(m => ({ default: m.Focus })));
const DailyTimeline = lazy(() => import('./features/timeline/DailyTimeline').then(m => ({ default: m.DailyTimeline })));
const Analytics = lazy(() => import('./features/analytics/Analytics').then(m => ({ default: m.Analytics })));
const Profile = lazy(() => import('./features/profile/Profile').then(m => ({ default: m.Profile })));
const Settings = lazy(() => import('./features/settings/Settings').then(m => ({ default: m.Settings })));

function RouteLoader() {
  return <PremiumRouteLoader fullscreen={false} label="Preparing workspace..." />;
}

export default function App() {
  return (
    <AuthProvider>
      <GlobalErrorBoundary>
        <AppEntryExperience />
        <ModalProvider>
          <ToastProvider>
            <Router>
              <PWAInstallPrompt />
              <Routes>
                {/* Public Routes */}
                <Route element={<PublicRoute />}>
                  <Route path="/login" element={<LoginForm />} />
                  <Route path="/signup" element={<SignUpForm />} />
                  <Route path="/forgot-password" element={<ForgotPasswordForm />} />
                  <Route path="/reset-password" element={<ResetPasswordForm />} />
                  <Route path="/" element={<Navigate to="/login" replace />} />
                </Route>

                {/* Protected Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/dashboard" element={<Suspense fallback={<RouteLoader />}><Dashboard /></Suspense>} />
                    <Route path="/habits" element={<Suspense fallback={<RouteLoader />}><Habits /></Suspense>} />
                    <Route path="/notes" element={<Suspense fallback={<RouteLoader />}><Notes /></Suspense>} />
                    <Route path="/projects" element={<Suspense fallback={<RouteLoader />}><Projects /></Suspense>} />
                    <Route path="/focus" element={<Suspense fallback={<RouteLoader />}><Focus /></Suspense>} />
                    <Route path="/timeline" element={<Suspense fallback={<RouteLoader />}><DailyTimeline /></Suspense>} />
                    <Route path="/analytics" element={<Suspense fallback={<RouteLoader />}><Analytics /></Suspense>} />
                    <Route path="/profile" element={<Suspense fallback={<RouteLoader />}><Profile /></Suspense>} />
                    <Route path="/settings" element={<Suspense fallback={<RouteLoader />}><Settings /></Suspense>} />
                  </Route>
                </Route>

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Router>
          </ToastProvider>
        </ModalProvider>
      </GlobalErrorBoundary>
    </AuthProvider>
  );
}
