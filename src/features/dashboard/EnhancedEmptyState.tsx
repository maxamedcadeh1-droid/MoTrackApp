import React from 'react';
import { CheckCircle2, Clock, Target, FileText, Sparkles, ArrowRight } from 'lucide-react';
import { Card, Button } from '../../components/ui/Layout';

interface EmptyStateProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'minimal';
}

export function EnhancedEmptyState({
  icon: Icon,
  title,
  description,
  action,
  secondaryAction,
  variant = 'default'
}: EmptyStateProps) {
  if (variant === 'minimal') {
    return (
      <div className="text-center py-8">
        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4">
          <Icon className="w-6 h-6 text-zinc-600" />
        </div>
        <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
        <p className="text-sm text-zinc-500 mb-4 max-w-xs mx-auto">{description}</p>
        {action && (
          <Button onClick={action.onClick} size="sm" variant="outline">
            {action.label}
          </Button>
        )}
      </div>
    );
  }

  return (
    <Card className="border-dashed border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent">
      <div className="text-center py-12 px-6">
        <div className="relative mx-auto w-20 h-20 mb-6">
          <div className="absolute inset-0 bg-accent/5 rounded-2xl blur-xl" />
          <div className="relative w-full h-full rounded-2xl bg-gradient-to-br from-accent/10 to-accent/5 border border-accent/20 flex items-center justify-center">
            <Icon className="w-8 h-8 text-accent" />
          </div>
        </div>

        <h3 className="text-xl font-display font-semibold text-white mb-3">{title}</h3>
        <p className="text-zinc-400 mb-8 max-w-sm mx-auto leading-relaxed">{description}</p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {action && (
            <Button
              onClick={action.onClick}
              className="bg-accent/10 hover:bg-accent/20 border-accent/20 hover:border-accent/40 text-accent"
            >
              {action.label}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          )}

          {secondaryAction && (
            <Button
              onClick={secondaryAction.onClick}
              variant="ghost"
              className="text-zinc-400 hover:text-white"
            >
              {secondaryAction.label}
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
}

// Pre-configured empty states for common scenarios
export function WelcomeEmptyState({ navigate }: { navigate: (path: string) => void }) {
  return (
    <EnhancedEmptyState
      icon={Sparkles}
      title="Welcome to MoTrack"
      description="Start building momentum with habits, focus sessions, and projects. Your productivity journey begins here."
      action={{
        label: "Get started",
        onClick: () => navigate('/habits?add=true')
      }}
    />
  );
}

export function HabitsEmptyState({ navigate }: { navigate: (path: string) => void }) {
  return (
    <EnhancedEmptyState
      icon={CheckCircle2}
      title="No habits yet"
      description="Create your first habit to start building consistent routines that drive your productivity forward."
      action={{
        label: "Create habit",
        onClick: () => navigate('/habits?add=true')
      }}
    />
  );
}

export function ProjectsEmptyState({ navigate }: { navigate: (path: string) => void }) {
  return (
    <EnhancedEmptyState
      icon={Target}
      title="No projects yet"
      description="Turn your goals into actionable plans. Break them down into tasks and track your progress."
      action={{
        label: "Create project",
        onClick: () => navigate('/projects?add=true')
      }}
    />
  );
}

export function NotesEmptyState({ navigate }: { navigate: (path: string) => void }) {
  return (
    <EnhancedEmptyState
      icon={FileText}
      title="No notes yet"
      description="Capture your thoughts, ideas, and insights. Keep everything organized and easy to find."
      action={{
        label: "Write note",
        onClick: () => navigate('/notes?add=true')
      }}
    />
  );
}

export function FocusEmptyState({ navigate }: { navigate: (path: string) => void }) {
  return (
    <EnhancedEmptyState
      icon={Clock}
      title="No focus sessions yet"
      description="Start your first focus session to experience deep, distraction-free work that builds momentum."
      action={{
        label: "Start focus",
        onClick: () => navigate('/focus?start=true')
      }}
    />
  );
}