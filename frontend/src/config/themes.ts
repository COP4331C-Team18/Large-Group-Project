// ─── themes.ts ────────────────────────────────────────────────────────────────

export type ThemeId =
  | 'inkboard'
  | 'cupcake'
  | 'retro'
  | 'pastel'
  | 'bumblebee';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  description: string;
  daisyTokens?: Record<string, string>; // only for custom themes
}

// ─── Theme registry ───────────────────────────────────────────────────────────

export const THEMES: ThemeOption[] = [
  {
    id: 'inkboard',
    label: 'Inkboard',
    description:
      'Natural earth tones — forest moss, aged parchment, and deep ink.',
    daisyTokens: {
      primary: '#4a5a3a',
      'primary-content': '#e4ddd0',
      secondary: '#6b5540',
      'secondary-content': '#ede8df',
      accent: '#2a2d2e',
      'accent-content': '#e4ddd0',
      neutral: '#2a2d2e',
      'neutral-content': '#c8bfae',
      'base-100': '#ede8df',
      'base-200': '#e8e2d8',
      'base-300': '#ddd6c8',
      'base-content': '#111410',
      info: '#6b7f54',
      success: '#4a5a3a',
      warning: '#f59e0b',
      error: '#8b3a1a',
    },
  },
  {
    id: 'cupcake',
    label: 'Cupcake',
    description:
      'Soft pastels and playful warmth — light, airy, and inviting.',
  },
  {
    id: 'retro',
    label: 'Retro',
    description:
      'Warm vintage palette with a nostalgic, analogue feel.',
  },
  {
    id: 'pastel',
    label: 'Pastel',
    description:
      'Gentle, muted hues — calm and easy on the eyes.',
  },
  {
    id: 'bumblebee',
    label: 'Bumblebee',
    description:
      'Bold yellow and black contrast — energetic and high visibility.',
  },
];

// ─── Swatch config (shared) ───────────────────────────────────────────────────

export const SWATCHES = [
  { name: 'primary', var: '--color-primary' },
  { name: 'secondary', var: '--color-secondary' },
  { name: 'accent', var: '--color-accent' },
  { name: 'base', var: '--color-base-100' },
  { name: 'content', var: '--color-base-content' },
];

// ─── Local storage helpers ─────────────────────────────────────────────────────

export const STORAGE_KEY = 'inkboard-theme';

export function getSavedTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (stored && THEMES.find(t => t.id === stored)) return stored;
  } catch {}
  return 'inkboard';
}

export function applyTheme(themeId: ThemeId) {
  document.documentElement.setAttribute('data-theme', themeId);
  try {
    localStorage.setItem(STORAGE_KEY, themeId);
  } catch {}
}

// ─── Tailwind helper ──────────────────────────────────────────────────────────

export function buildDaisyThemes(): Array<
  string | Record<string, Record<string, string>>
> {
  return THEMES.map(theme =>
    theme.daisyTokens ? { [theme.id]: theme.daisyTokens } : theme.id
  );
}