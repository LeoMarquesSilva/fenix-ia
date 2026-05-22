export const THEME_KEY = 'fenix-theme'

export function getTheme(): 'light' | 'dark' {
  try {
    return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

export function setTheme(mode: 'light' | 'dark') {
  try {
    localStorage.setItem(THEME_KEY, mode)
  } catch {
    /* ignore */
  }
  if (mode === 'dark') document.documentElement.classList.add('dark')
  else document.documentElement.classList.remove('dark')
}

export function toggleTheme() {
  const next = document.documentElement.classList.contains('dark')
    ? 'light'
    : 'dark'
  setTheme(next)
}
