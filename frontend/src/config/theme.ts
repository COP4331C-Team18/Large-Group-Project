// ─── themes.ts ────────────────────────────────────────────────────────────────
// Single source of truth for daisyUI theme definitions.
// Imported by both tailwind.config.js and React components so themes only
// ever need to be added/edited in one place.
 
export type ThemeId = 'inkboard' | 'cupcake' | 'retro' | 'pastel' | 'bumblebee';
 
export interface ThemeSwatch {
  primary:   string;
  secondary: string;
  accent:    string;
  base:      string;
  content:   string;
}
 
export interface ThemeOption {
  id:          ThemeId;
  label:       string;
  description: string;
  /** Preview swatches shown in the settings UI. */
  swatch:      ThemeSwatch;
  /**
   * Full daisyUI token map — consumed by tailwind.config.js.
   * Omit this field for built-in daisyUI themes (cupcake, retro, pastel)
   * since daisyUI already knows their full token sets.
   */
  daisyTokens?: Record<string, string>;
}
 
// ─── Theme registry ───────────────────────────────────────────────────────────
 
export const THEMES: ThemeOption[] = [
  {
    id:          'inkboard',
    label:       'Inkboard',
    description: 'Natural earth tones — forest moss, aged parchment, and deep ink.',
    swatch: {
      primary:   '#4a5a3a',
      secondary: '#6b5540',
      accent:    '#2a2d2e',
      base:      '#ede8df',
      content:   '#111410',
    },
    daisyTokens: {
      'primary':          '#4a5a3a',
      'primary-content':  '#e4ddd0',
      'secondary':        '#6b5540',
      'secondary-content':'#ede8df',
      'accent':           '#2a2d2e',
      'accent-content':   '#e4ddd0',
      'neutral':          '#2a2d2e',
      'neutral-content':  '#c8bfae',
      'base-100':         '#ede8df',
      'base-200':         '#e8e2d8',
      'base-300':         '#ddd6c8',
      'base-content':     '#111410',
      'info':             '#6b7f54',
      'success':          '#4a5a3a',
      'warning':          '#f59e0b',
      'error':            '#8b3a1a',
    },
  },
  {
    id:          'cupcake',
    label:       'Cupcake',
    description: 'Soft pastels and playful warmth — light, airy, and inviting.',
    swatch: {
      primary:   '#65c3c8',
      secondary: '#ef9fbc',
      accent:    '#eeaf3a',
      base:      '#faf7f5',
      content:   '#291334',
    },
    // No daisyTokens — cupcake is a built-in daisyUI theme
  },
  {
    id:          'retro',
    label:       'Retro',
    description: 'Warm vintage palette with a nostalgic, analogue feel.',
    swatch: {
      primary:   '#ef9995',
      secondary: '#a4cbb4',
      accent:    '#ebdc99',
      base:      '#e4d8b4',
      content:   '#282425',
    },
    // No daisyTokens — retro is a built-in daisyUI theme
  },
  {
    id:          'pastel',
    label:       'Pastel',
    description: 'Gentle, muted hues — calm and easy on the eyes.',
    swatch: {
      primary:   '#d1c1d7',
      secondary: '#f6cbd1',
      accent:    '#b4e9d6',
      base:      '#ffffff',
      content:   '#333c4d',
    },
    // No daisyTokens — pastel is a built-in daisyUI theme
  },
  {
    id:             'bumblebee',
    label:          'Bumblebee',
    description:    'Some description',
    swatch: {
      primary:   '',
      secondary: '',
      accent:    '',
      base:      '',
      content:   '',
    },
    // No daisyTokens — pastel is a built-in daisyUI theme  
  },
  {
    id:             'bumblebee',
    label:          'Bumblebee',
    description:    'Some description',
    swatch: {
      primary:   '',
      secondary: '',
      accent:    '',
      base:      '',
      content:   '',
    },
    // No daisyTokens — pastel is a built-in daisyUI theme  
  },
  {
    id:             'bumblebee',
    label:          'Bumblebee',
    description:    'Some description',
    swatch: {
      primary:   '',
      secondary: '',
      accent:    '',
      base:      '',
      content:   '',
    },
    // No daisyTokens — pastel is a built-in daisyUI theme  
  },
  {
    id:             'bumblebee',
    label:          'Bumblebee',
    description:    'Some description',
    swatch: {
      primary:   '',
      secondary: '',
      accent:    '',
      base:      '',
      content:   '',
    },
    // No daisyTokens — pastel is a built-in daisyUI theme  
  },
  {
    id:             'bumblebee',
    label:          'Bumblebee',
    description:    'Some description',
    swatch: {
      primary:   '',
      secondary: '',
      accent:    '',
      base:      '',
      content:   '',
    },
    // No daisyTokens — pastel is a built-in daisyUI theme  
  },
  {
    id:             'bumblebee',
    label:          'Bumblebee',
    description:    'Some description',
    swatch: {
      primary:   '',
      secondary: '',
      accent:    '',
      base:      '',
      content:   '',
    },
    // No daisyTokens — pastel is a built-in daisyUI theme  
  },
];
 
// ─── Helpers used by React at runtime ─────────────────────────────────────────
 
export const STORAGE_KEY = 'inkboard-theme';
 
export function getSavedTheme(): ThemeId {
  try {
    const stored = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (stored && THEMES.find(t => t.id === stored)) return stored;
  } catch {
    // ignore — SSR or storage blocked
  }
  return 'inkboard';
}
 
export function applyTheme(themeId: ThemeId) {
  document.documentElement.setAttribute('data-theme', themeId);
}
 
// ─── Helper used by tailwind.config.js at build time ──────────────────────────
 
/**
 * Returns the daisyUI `themes` array expected by tailwind.config.js.
 * Built-in themes are passed as plain strings; custom themes (those with
 * daisyTokens) are passed as objects.
 *
 * Usage in tailwind.config.js:
 *   import { buildDaisyThemes } from './src/config/themes';
 *   ...
 *   daisyui: { themes: buildDaisyThemes() }
 */
export function buildDaisyThemes(): Array<string | Record<string, Record<string, string>>> {
  return THEMES.map(theme =>
    theme.daisyTokens
      ? { [theme.id]: theme.daisyTokens }
      : theme.id
  );
}
 