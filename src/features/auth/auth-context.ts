import { createContext } from 'react';
import type { AuthError, Session, User } from '@supabase/supabase-js';

export interface AuthContextType {
  user: User | null;
  profile: any | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<{ error: AuthError | null }>;
  refreshProfile: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
