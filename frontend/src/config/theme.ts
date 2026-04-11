export type ThemeId = 
    'inkboard'
    | 'cupcake' 
    | 'retro' 
    | 'pastel' 
    | 'cmyk'
    | 'nord' 
    | 'dark'
    | 'dim'
    | 'dracula'
    | 'coffee';
 
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
  swatch:      ThemeSwatch;
  daisyTokens?: Record<string, string>;
}
 
// theme registry
export const THEMES: ThemeOption[] = [
  {
    id:          'inkboard',
    label:       'Inkboard',
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
    swatch: {
      primary:   '#65c3c8',
      secondary: '#ef9fbc',
      accent:    '#eeaf3a',
      base:      '#faf7f5',
      content:   '#291334',
    },
  },
  {
    id:          'retro',
    label:       'Retro',
    swatch: {
      primary:   '#ef9995',
      secondary: '#a4cbb4',
      accent:    '#ebdc99',
      base:      '#e4d8b4',
      content:   '#282425',
    },
  },
  {
    id:          'pastel',
    label:       'Pastel',
    swatch: {
      primary:   '#d1c1d7',
      secondary: '#f6cbd1',
      accent:    '#b4e9d6',
      base:      '#ffffff',
      content:   '#333c4d',
    },
  },
  {
    id:             'cmyk',
    label:          'cmyk',
    swatch: {
      primary:   '#45aeee',
      secondary: '#e8488a',
      accent:    '#f5a524',
      base:      '#ffffff',
      content:   '#1f2937',
    }, 
  },
  {
    id:             'nord',
    label:          'Nord',
    swatch: {
      primary:   '#5e81ac',
      secondary: '#81a1c1',
      accent:    '#88c0d0',
      base:      '#2e3440',
      content:   '#eceff4',
    },
  },
  {
    id:             'dark',
    label:          'Dark',
    swatch: {
      primary:   '#661ae6',
      secondary: '#d926a9',
      accent:    '#1fb2a6',
      base:      '#1d232a',
      content:   '#a6adbb',
    },
  },
  {
    id:             'dim',
    label:          'Dim',
    swatch: {
      primary:   '#9ca3af',
      secondary: '#d1d5db',
      accent:    '#6b7280',
      base:      '#1f2937',
      content:   '#e5e7eb',
    },
  },
  {
    id:             'dracula',
    label:          'Dracula',
    swatch: {
      primary:   '#ff79c6',
      secondary: '#bd93f9',
      accent:    '#ffb86c',
      base:      '#282a36',
      content:   '#f8f8f2',
    },
  },
  {
    id:             'coffee',
    label:          'Coffee',
    swatch: {
      primary:   '#db924b',
      secondary: '#263e3f',
      accent:    '#10576d',
      base:      '#20161f',
      content:   '#f4f4f5',
    },
  },
];
 
export const STORAGE_KEY = 'inkboard-theme';

const COOKIE_MAX_AGE_DAYS = 400;
 
// storing themes using cookies
export function saveThemeCookie(themeId: ThemeId): void {
  const maxAge = COOKIE_MAX_AGE_DAYS * 24 * 60 * 60; // convert days → seconds
  document.cookie = `${STORAGE_KEY}=${themeId}; max-age=${maxAge}; path=/; SameSite=Lax`;
}
 
// read theme value from cookie string
export function getSavedTheme(): ThemeId {
  try {
    const match = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${STORAGE_KEY}=`));
 
    if (match) {
      const value = match.split('=')[1] as ThemeId;
      if (THEMES.find(t => t.id === value)) return value;
    }
  } catch {
    // ignore
  }
  return 'inkboard';
}
 
export function applyTheme(themeId: ThemeId): void {
  document.documentElement.setAttribute('data-theme', themeId);
}

// returns daisyUI themes and custom themes from tailwind.config.js
export function buildDaisyThemes(): Array<string | Record<string, Record<string, string>>> {
  return THEMES.map(theme =>
    theme.daisyTokens
      ? { [theme.id]: theme.daisyTokens }
      : theme.id
  );
}