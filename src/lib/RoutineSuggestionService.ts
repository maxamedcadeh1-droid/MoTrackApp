export type RoutineSuggestion = {
  headline: string;
  subtext: string;
  actionLabel: string;
  actionPath: string;
  confidence: number;
};

export function buildRoutineSuggestion({
  currentHour,
  remainingFocusMinutes,
  totalHabits,
  habitsCompleted,
  activeProjects,
  projectProgress,
}: {
  currentHour: number;
  remainingFocusMinutes: number;
  totalHabits: number;
  habitsCompleted: number;
  activeProjects: number;
  projectProgress: number;
}): RoutineSuggestion {
  const incompleteHabits = Math.max(totalHabits - habitsCompleted, 0);

  if (totalHabits === 0) {
    return {
      headline: 'Start with one anchor habit.',
      subtext: 'A simple daily reminder gives the rest of MoTrack a rhythm to build from.',
      actionLabel: 'Create Habit',
      actionPath: '/habits?add=true',
      confidence: 72,
    };
  }

  if (currentHour < 12 && remainingFocusMinutes > 0) {
    return {
      headline: 'Protect a morning focus block.',
      subtext: `${remainingFocusMinutes} focus minutes remain for today. A short ritual now can carry the day.`,
      actionLabel: 'Start Focus',
      actionPath: '/focus?start=true',
      confidence: 68,
    };
  }

  if (incompleteHabits > 0 && currentHour >= 17) {
    return {
      headline: 'Close one small habit before shutdown.',
      subtext: `${incompleteHabits} habit${incompleteHabits === 1 ? '' : 's'} still open. Choose the lightest one and keep the streak alive.`,
      actionLabel: 'Open Habits',
      actionPath: '/habits',
      confidence: 76,
    };
  }

  if (activeProjects > 0 && projectProgress < 60) {
    return {
      headline: 'Turn project weight into one next action.',
      subtext: 'Your active projects have room to move. Finish one task or schedule a focused pass.',
      actionLabel: 'Review Projects',
      actionPath: '/projects',
      confidence: 64,
    };
  }

  if (remainingFocusMinutes > 0) {
    return {
      headline: 'A focused reset would help today.',
      subtext: `${remainingFocusMinutes} focus minutes remain. Even a shorter session can restore momentum.`,
      actionLabel: 'Start Focus',
      actionPath: '/focus?start=true',
      confidence: 61,
    };
  }

  return {
    headline: 'Set up tomorrow while the signal is clear.',
    subtext: 'Your core work is in motion. Review the timeline and make tomorrow easier to start.',
    actionLabel: 'Open Timeline',
    actionPath: '/timeline',
    confidence: 70,
  };
}
