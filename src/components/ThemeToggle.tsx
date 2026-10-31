import { Moon, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Button } from './ui';

type Theme = 'light' | 'dark';
const KEY = 'calc-presupuestos:theme';

// El mismo cálculo corre en index.html antes de pintar, para evitar un parpadeo.
function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === 'light' || saved === 'dark') return saved;
  } catch {
    /* sin almacenamiento: se usa la preferencia del sistema */
  }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(initialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0f172a' : '#4f46e5');
  }, [theme]);

  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      /* la preferencia sólo dura esta sesión */
    }
  };

  const dark = theme === 'dark';
  return (
    <Button
      variant="ghost"
      onClick={toggle}
      title={dark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      icon={dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    >
      {dark ? 'Claro' : 'Oscuro'}
    </Button>
  );
}
