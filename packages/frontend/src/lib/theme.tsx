import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'light' | 'dark'
export type Accent = 'blue' | 'violet' | 'emerald' | 'rose' | 'orange'

const ThemeContext = createContext<{
  theme: Theme
  toggleTheme: () => void
  accent: Accent
  setAccent: (accent: Accent) => void
}>({ theme: 'light', toggleTheme: () => {}, accent: 'blue', setAccent: () => {} })

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme')
    if (stored === 'dark' || stored === 'light') return stored
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  })
  const [accent, setAccent] = useState<Accent>(() => (localStorage.getItem('accent') as Accent) || 'blue')

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
    localStorage.setItem('theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.accent = accent
    localStorage.setItem('accent', accent)
  }, [accent])

  const toggleTheme = () => setTheme(t => (t === 'light' ? 'dark' : 'light'))

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
