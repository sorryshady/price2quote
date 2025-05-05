import { Dispatch, SetStateAction, useEffect, useMemo, useState } from 'react'

import { useTheme } from 'next-themes'

type Theme = 'dark' | 'light'
type SetTheme = Dispatch<SetStateAction<Theme>>

export default function useSystemTheme() {
  const { theme, setTheme, systemTheme } = useTheme()
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  return useMemo(() => {
    return {
      theme: theme === 'system' ? systemTheme : theme,
      setTheme,
      mounted: isMounted,
    } as { theme: Theme; setTheme: SetTheme; mounted: boolean }
  }, [theme, systemTheme, setTheme, isMounted])
}
