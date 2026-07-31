import { useCallback, useSyncExternalStore } from 'react';

function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (callback: () => void) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', callback);
      return () => mql.removeEventListener('change', callback);
    },
    [query],
  );
  const getSnapshot = useCallback(() => window.matchMedia(query).matches, [query]);
  // Fall back to 'true' (today's baseline "wide" layout) until the client can
  // evaluate the real query, rather than jumping to the narrowest tier.
  const getServerSnapshot = useCallback(() => true, []);

  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}

export type ViewportTier = 'wide' | 'medium' | 'narrow';

// Rem-based, matching Tailwind v4's own breakpoint convention (1rem = 16px here,
// since <html> has no font-size override): 40rem = 640px, 56.25rem = 900px.
const MEDIUM_UP_QUERY = '(min-width: 40rem)';
const WIDE_QUERY = '(min-width: 56.25rem)';

export function useViewportTier(): ViewportTier {
  const isMediumUp = useMediaQuery(MEDIUM_UP_QUERY);
  const isWide = useMediaQuery(WIDE_QUERY);

  if (!isMediumUp) return 'narrow';
  if (!isWide) return 'medium';
  return 'wide';
}
