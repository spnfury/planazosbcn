'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * Returns true after the component has hydrated on the client. Safe pattern
 * to gate client-only UI without setState-in-effect (React 19 strict).
 */
export function useIsClient() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
