import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../../components/ui/ToastProvider';
import { useAuth } from './useAuth';

export function useLogout() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { showToast } = useToast();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = useCallback(async (onSuccess?: () => void) => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      const { error } = await signOut();

      if (error) {
        showToast(error.message || 'Something went wrong', 'error');
        return;
      }

      onSuccess?.();
      showToast('Logged out successfully', 'success');
      navigate('/login', { replace: true });
    } catch (error: any) {
      showToast(error?.message || 'Something went wrong', 'error');
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, navigate, showToast, signOut]);

  return { handleLogout, isLoggingOut };
}
