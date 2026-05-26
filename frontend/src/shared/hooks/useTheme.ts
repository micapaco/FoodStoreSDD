import { useState } from 'react'

export function useTheme() {
  const [isLight, setIsLight] = useState(() =>
    document.documentElement.classList.contains('light')
  )

  function toggleTheme() {
    const next = !isLight
    if (next) {
      document.documentElement.classList.add('light')
      localStorage.setItem('theme', 'light')
    } else {
      document.documentElement.classList.remove('light')
      localStorage.setItem('theme', 'dark')
    }
    setIsLight(next)
  }

  return { isLight, toggleTheme }
}
