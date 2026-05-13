import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { NavigateOptions } from 'react-router-dom';

/** SPA navigation only — no full reloads or `window.location` assignments. */
export function useReliableNavigate() {
  const navigate = useNavigate();

  return useCallback((to: string, options?: NavigateOptions) => {
    navigate(to, options);
  }, [navigate]);
}

export function normalizePathname(pathname: string) {
  return pathname.replace(/\/+$/, '') || '/';
}
