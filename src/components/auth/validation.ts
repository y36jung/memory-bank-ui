export const PASSWORD_MIN_LENGTH = 8;

export function emailValid(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

export function pwScore(pw: string): 0 | 1 | 2 | 3 {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= PASSWORD_MIN_LENGTH) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  if (pw.length >= PASSWORD_MIN_LENGTH && /[^A-Za-z0-9]/.test(pw)) s++;
  return Math.min(s, 3) as 0 | 1 | 2 | 3;
}

export const PW_LABELS = ['Too short', 'Weak', 'Good', 'Strong'];
