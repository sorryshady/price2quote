import { useEffect, useState } from 'react'

import { useTheme } from 'next-themes'

type Theme = 'dark' | 'light'

export default function useSystemTheme() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return {
    theme: (theme === 'system' ? systemTheme : theme) as Theme,
    setTheme,
    mounted,
    systemTheme: systemTheme as Theme,
    userTheme: theme as Theme | 'system',
  }
}
