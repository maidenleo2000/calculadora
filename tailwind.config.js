import colors from 'tailwindcss/colors';

// Los colores neutros y los tonos suaves de acento salen de variables CSS
// (src/index.css) para que el modo oscuro se resuelva en un solo lugar.
const v = (name) => `rgb(var(--${name}) / <alpha-value>)`;
const scale = (name, shades) => Object.fromEntries(shades.map((s) => [s, v(`${name}-${s}`)]));

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        page: v('page'),
        surface: v('surface'),
        slate: scale('slate', [50, 100, 200, 300, 400, 500, 600, 700, 800, 900]),
        indigo: { ...colors.indigo, ...scale('indigo', [50, 600, 700]) },
        emerald: { ...colors.emerald, ...scale('emerald', [50, 600, 700, 800]) },
        amber: { ...colors.amber, ...scale('amber', [50, 200, 700, 800]) },
        rose: { ...colors.rose, ...scale('rose', [50, 600]) },
      },
    },
  },
  plugins: [],
};
