import { useEffect } from 'react';

/** Dev-only: confirm route pages mount/unmount when the URL changes. */
export function useRouteLifecycleDebug(routeName: string) {
  useEffect(() => {
    if (!import.meta.env.DEV) return;
    console.log(`[MoTrack] MOUNTED: ${routeName}`);
    return () => {
      console.log(`[MoTrack] UNMOUNTED: ${routeName}`);
    };
  }, [routeName]);
}
