const STORAGE_KEY = 'mb_welcome_seen';

let seen = true; // safe default until checked on the client
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

export function subscribeWelcomeGuideSeen(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getWelcomeGuideSeenSnapshot(): boolean {
  return seen;
}

/** Syncs `seen` from localStorage. Call once on mount — reading storage during render/SSR isn't safe. */
export function checkWelcomeGuideSeen(): void {
  if (typeof window === 'undefined') return;
  try {
    seen = window.localStorage.getItem(STORAGE_KEY) === 'true';
  } catch {
    seen = true;
  }
  emit();
}

export function markWelcomeGuideSeen(): void {
  seen = true;
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    } catch {
      // ignore
    }
  }
  emit();
}
