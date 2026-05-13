import type { ReactElement } from 'react';
import { useEffect } from 'react';

// RouteRefreshGuard previously forced full page reloads when it detected a "route mismatch".
// That behavior breaks SPA navigation/state. We now do nothing.
export function RouteRefreshGuard(): ReactElement | null {
  useEffect(() => {
    // intentionally no-op
  }, []);

  return null;
}
