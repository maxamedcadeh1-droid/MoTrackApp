import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './features/auth/AuthContext';
import { ProtectedRoute, PublicRoute } from './features/auth/ProtectedRoute';
import { DashboardLayout } from './components/DashboardLayout';

// Auth Pages
import { LoginForm } from './features/auth/LoginForm';
import { SignUpForm } from './features/auth/SignUpForm';

// Dashboard Pages
import { Dashboard } from './features/dashboard/Dashboard';
import { Habits } from './features/habits/Habits';
import { Notes } from './features/notes/Notes';
import { Projects } from './features/projects/Projects';
import { Focus } from './features/focus/Focus';
import { Analytics } from './features/analytics/Analytics';
import { Profile } from './features/profile/Profile';
import { Settings } from './features/settings/Settings';
import { CommandCenter } from './components/CommandCenter';
import { QuickAdd } from './components/QuickAdd';

import { motion } from 'motion/react';

function Header({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="space-y-1 mb-8"
    >
      <h1 className="text-4xl font-bold tracking-tight text-white mb-2">{title}</h1>
      {subtitle && <p className="text-zinc-500 text-lg">{subtitle}</p>}
    </motion.div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <CommandCenter />
        <QuickAdd />
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicRoute />}>
            <Route path="/login" element={<LoginForm />} />
            <Route path="/signup" element={<SignUpForm />} />
            <Route path="/" element={<Navigate to="/login" replace />} />
          </Route>

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/habits" element={<Habits />} />
              <Route path="/notes" element={<Notes />} />
              <Route path="/projects" element={<Projects />} />
              <Route path="/focus" element={<Focus />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/settings" element={<Settings />} />
            </Route>
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}
