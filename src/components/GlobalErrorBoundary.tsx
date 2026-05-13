import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from './ui/Layout';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

function GlobalErrorBoundaryWithNavigation({ children }: Props) {
  const navigate = useNavigate();
  const [state, setState] = React.useState<State>({ hasError: false, error: null });

  const handleReload = () => {
    setState({ hasError: false, error: null });
    navigate('/dashboard', { replace: true });
  };

  if (state.hasError) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[#05060a] p-6 text-center text-white">
        <div className="relative mb-8">
          <div className="absolute inset-0 animate-pulse rounded-full bg-red-500/20 blur-3xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-[2rem] border border-red-500/20 bg-red-500/10 text-red-400">
            <AlertTriangle className="h-10 w-10" />
          </div>
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
          Workspace Disrupted
        </h1>
        <p className="mt-3 max-w-md text-sm text-zinc-500 leading-relaxed">
          A critical error occurred while rendering your dashboard. We've captured the technical details and are ready to restore your session.
        </p>

        <div className="mt-8 rounded-2xl border border-white/5 bg-white/[0.02] p-4 text-left font-mono text-[10px] text-zinc-600 max-w-lg overflow-auto">
          <p className="font-bold text-zinc-500 uppercase tracking-widest mb-1">Error Trace:</p>
          {state.error?.message || 'Unknown runtime exception'}
        </div>

        <Button
          onClick={handleReload}
          className="mt-10 rounded-2xl px-8 gap-2"
          variant="primary"
        >
          <RefreshCw className="h-4 w-4" />
          Restore Session
        </Button>

        <button
          onClick={() => {
            setState({ hasError: false, error: null });
            navigate('/dashboard', { replace: true });
          }}
          className="mt-4 text-xs font-medium text-zinc-600 hover:text-zinc-400 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return children;
}

class GlobalErrorBoundaryInner extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error);
    if (process.env.NODE_ENV !== 'production') {
      console.error('React component stack:', errorInfo.componentStack);
    }
  }

  public render() {
    return this.props.children;
  }
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Keep the real component stack in dev; also log to console for production telemetry tooling.
    console.error('Uncaught error:', error);
    if (process.env.NODE_ENV !== 'production') {
      // errorInfo.componentStack contains the React component stack (critical for debugging).
      console.error('React component stack:', errorInfo.componentStack);
    }
  }

  public render() {
    if (this.state.hasError) {
      // Delegate UI to functional wrapper to use navigate() without full reload.
      return <GlobalErrorBoundaryWithNavigation>{this.props.children}</GlobalErrorBoundaryWithNavigation>;
    }
    return this.props.children;
  }
}
