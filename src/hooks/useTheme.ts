import { useState, useEffect } from 'react'
import { taskService } from '../services/taskService'

export function useTheme() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  useEffect(() => {
    // Load initial setting
    taskService.getSettings().then((settings) => {
      let resolved: 'dark' | 'light' = 'dark'
      if (settings.theme === 'system') {
        resolved = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      } else {
        resolved = settings.theme
      }
      setTheme(resolved)
      applyTheme(resolved)
    })
  }, [])

  const applyTheme = (newTheme: 'dark' | 'light') => {
    const root = document.documentElement
    if (newTheme === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.add('light')
      root.classList.remove('dark')
    }
  }

  const toggleTheme = async () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(nextTheme)
    applyTheme(nextTheme)
    await taskService.updateSettings({ theme: nextTheme })
  }

  return { theme, toggleTheme }
}
