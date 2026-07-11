export type Theme = 'dark' | 'light';

const KEY = 'kankor-theme';

export function getTheme(): Theme {
  return (localStorage.getItem(KEY) as Theme) || 'dark';
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem(KEY, theme);
  const meta = document.querySelector('meta[name="theme-color"]');
  meta?.setAttribute('content', theme === 'dark' ? '#0B1E3F' : '#f3f5fa');
}
