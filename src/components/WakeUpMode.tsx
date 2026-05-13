/**
 * WakeUpMode - Cinematic wake-up experience
 *
 * Temporarily disabled to prevent navigation/render loops.
 * This keeps the app stable; wake overlays will be re-enabled once the root trigger is fixed.
 */

export interface WakeUpData {
  userName: string;
  habitTitle: string;
  habitColor?: string;
  momentumScore?: number;
  triggeredAt: string;
}

interface WakeUpModeProps {
  data: WakeUpData | null;
  onDismiss: () => void;
  onSnooze: () => void;
  onComplete: () => void;
}

export function WakeUpMode(_props: WakeUpModeProps) {
  return null;
}
