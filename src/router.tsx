import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ProtectedRoute, PublicRoute } from './features/auth/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';
import { LoginForm } from './features/auth/LoginForm';
import { SignUpForm } from './features/auth/SignUpForm';
import { ForgotPasswordForm } from './features/auth/ForgotPasswordForm';
import { ResetPasswordForm } from './features/auth/ResetPasswordForm';
import { PremiumRouteLoader } from './components/AppEntryExperience';

function PageFallback() {
  return <PremiumRouteLoader fullscreen={false} label="Loading…" />;
}

const Dashboard = lazy(() => import('./features/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })));
const Habits = lazy(() => import('./features/habits/Habits').then((m) => ({ default: m.Habits })));
const Notes = lazy(() => import('./features/notes/Notes').then((m) => ({ default: m.Notes })));
const Projects = lazy(() => import('./features/projects/Projects').then((m) => ({ default: m.Projects })));
const Focus = lazy(() => import('./features/focus/Focus').then((m) => ({ default: m.Focus })));
const DailyTimeline = lazy(() => import('./features/timeline/DailyTimeline').then((m) => ({ default: m.DailyTimeline })));
const Analytics = lazy(() => import('./features/analytics/Analytics').then((m) => ({ default: m.Analytics })));
const Profile = lazy(() => import('./features/profile/Profile').then((m) => ({ default: m.Profile })));
const Settings = lazy(() => import('./features/settings/Settings').then((m) => ({ default: m.Settings })));

/**
 * Single data-router tree: URL, matches, and <Outlet /> stay in sync (RR7 + lazy layouts).
 */
export const router = createBrowserRouter(
  [
    {
      element: <PublicRoute />,
      children: [
        { path: 'login', element: <LoginForm /> },
        { path: 'signup', element: <SignUpForm /> },
        { path: 'forgot-password', element: <ForgotPasswordForm /> },
        { path: 'reset-password', element: <ResetPasswordForm /> },
        { index: true, element: <Navigate to="/login" replace /> },
      ],
    },
    {
      element: <ProtectedRoute />,
      children: [
        {
          element: <DashboardLayout />,
          children: [
            { index: true, element: <Navigate to="/dashboard" replace /> },
            {
              path: 'dashboard',
              element: (
                <Suspense fallback={<PageFallback />}>
                  <Dashboard />
                </Suspense>
              ),
            },
            {
              path: 'habits',
              element: (
                <Suspense fallback={<PageFallback />}>
                  <Habits />
                </Suspense>
              ),
            },
            {
              path: 'notes',
              element: (
                <Suspense fallback={<PageFallback />}>
                  <Notes />
                </Suspense>
              ),
            },
            {
              path: 'projects',
              element: (
                <Suspense fallback={<PageFallback />}>
                  <Projects />
                </Suspense>
              ),
            },
            {
              path: 'focus',
              element: (
                <Suspense fallback={<PageFallback />}>
                  <Focus />
                </Suspense>
              ),
            },
            {
              path: 'timeline',
              element: (
                <Suspense fallback={<PageFallback />}>
                  <DailyTimeline />
                </Suspense>
              ),
            },
            {
              path: 'analytics',
              element: (
                <Suspense fallback={<PageFallback />}>
                  <Analytics />
                </Suspense>
              ),
            },
            {
              path: 'profile',
              element: (
                <Suspense fallback={<PageFallback />}>
                  <Profile />
                </Suspense>
              ),
            },
            {
              path: 'settings',
              element: (
                <Suspense fallback={<PageFallback />}>
                  <Settings />
                </Suspense>
              ),
            },
          ],
        },
      ],
    },
    { path: '*', element: <Navigate to="/dashboard" replace /> },
  ]
);
