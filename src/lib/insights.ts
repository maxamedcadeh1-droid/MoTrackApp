export interface ProductivityInsight {
  headline: string;
  message: string;
  tone: 'celebration' | 'encouragement' | 'focus';
}

export function getTimeBasedGreeting(firstName: string): string {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return `${greeting}, ${firstName}.`;
}

export function getMomentumInsight({
  momentum,
  incompleteHabits,
  focusMinutes,
  dailyGoal,
  activeProjects,
}: {
  momentum: number;
  incompleteHabits: number;
  focusMinutes: number;
  dailyGoal: number;
  activeProjects: number;
}): ProductivityInsight {
  const remainingFocus = Math.max(dailyGoal - focusMinutes, 0);

  if (momentum >= 85) {
    return {
      headline: 'High momentum day',
      message: 'You are moving cleanly today. Protect the pace and close one meaningful item before you switch contexts.',
      tone: 'celebration',
    };
  }

  if (momentum >= 70) {
    return {
      headline: 'Strong progress',
      message: remainingFocus > 0
        ? `You are ${momentum}% on track. Another ${remainingFocus} focus minutes will strengthen your momentum.`
        : `You are ${momentum}% on track. A small habit or project closeout can lift the rest of the day.`,
      tone: 'encouragement',
    };
  }

  if (momentum >= 45) {
    return {
      headline: 'Momentum is building',
      message: incompleteHabits > 0
        ? `Complete ${Math.min(incompleteHabits, 2)} habit${Math.min(incompleteHabits, 2) === 1 ? '' : 's'} or one focus session to move the day forward.`
        : 'Your habits are in good shape. A focused work block is the fastest next lever.',
      tone: 'encouragement',
    };
  }

  return {
    headline: 'Start with one clean action',
    message: activeProjects > 0
      ? 'Pick one project task or start a focus session. Momentum comes back quickly when the first action is obvious.'
      : 'Create a habit, capture a note, or start a focus session to give today a clear first win.',
    tone: 'focus',
  };
}

export function getTrendIndicator(momentum: number, previousMomentum = 0): { trend: 'up' | 'down' | 'stable'; percentage: number } {
  const diff = Math.round(momentum - previousMomentum);
  if (diff > 5) return { trend: 'up', percentage: diff };
  if (diff < -5) return { trend: 'down', percentage: Math.abs(diff) };
  return { trend: 'stable', percentage: 0 };
}
