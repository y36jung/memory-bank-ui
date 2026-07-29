/** Whether this build should show beta-only UI (badge, demo login, register redirect). */
export const BETA_MODE = process.env.NEXT_PUBLIC_BETA_MODE === 'true';

/** Credentials submitted by the one-click "Use demo account" login button. */
export const DEMO_EMAIL = process.env.NEXT_PUBLIC_DEMO_EMAIL ?? null;
export const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD ?? null;

export const DEMO_LOGIN_ENABLED = BETA_MODE && !!DEMO_EMAIL && !!DEMO_PASSWORD;
