/**
 * Dark-mode preference shared by App, Dashboard and Settings.
 *
 * If the user has never used the in-app toggle, follow the operating
 * system's colour scheme. Tailwind's `dark:` variant is bound to the
 * `.dark` class (see index.css), so the class must be set whenever the
 * page is meant to look dark — otherwise text renders dark-on-dark.
 */
export const DARK_MODE_KEY = 'pedagogical_dark_mode';

export function getStoredDarkMode(): boolean {
  try {
    const saved = localStorage.getItem(DARK_MODE_KEY);
    if (saved === 'true') return true;
    if (saved === 'false') return false;
  } catch {
    /* storage unavailable — fall through to OS preference */
  }
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-color-scheme: dark)').matches;
}
