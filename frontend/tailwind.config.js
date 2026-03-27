/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif:  ['Lora', 'Georgia', 'serif'],
        sans:   ['Raleway', 'sans-serif'],
      },
      colors: {


        //Dashboard-colors
        'dashboard-txt': '#2a2d2e', //text
        'dashboard-primary': '#4a5a3a', // moss
        'dashboard-primary-content': '#e4ddd0', // stem-light
        'base-dashboard': '#e8e2d8', // base-200
        'dashboard-secondary': '#6b5540', // soil
        'dashboard-accent': '#2a2d2e', // cap


        cap:        '#2a2d2e',
        'cap-mid':  '#3d4244',
        stem:       '#c8bfae',
        'stem-light': '#e4ddd0',
        'stem-bg':  '#ede8df',
        ink:        '#111410',
        'ink-wet':  '#1e2118',
        moss:       '#4a5a3a',
        'moss-light': '#6b7f54',
        'moss-dim': '#8fa070',
        forest:     '#2e3d28',
        leaf:       '#a8b890',
        soil:       '#6b5540',
        'soil-light': '#9e8268',
        mist:       '#d8d4ca',
      },
    },
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        inkboard: {
          'primary':          '#4a5a3a',   // moss
          'primary-content':  '#e4ddd0',   // stem-light
          'secondary':        '#6b5540',   // soil
          'secondary-content':'#ede8df',
          'accent':           '#2a2d2e',   // cap
          'accent-content':   '#e4ddd0',
          'neutral':          '#2a2d2e',
          'neutral-content':  '#c8bfae',
          'base-100':         '#ede8df',   // stem-bg  (page bg)
          'base-200':         '#e8e2d8',
          'base-300':         '#ddd6c8',
          'base-content':     '#111410',   // ink
          'info':             '#6b7f54',
          'success':          '#4a5a3a',
          'warning':          '#9e8268',
          'error':            '#8b3a1a',
        },
      },
    ],
    darkTheme: false,
  },
};
