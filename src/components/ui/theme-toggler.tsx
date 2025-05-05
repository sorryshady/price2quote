'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'

import { Switch } from './switch'

const ThemeToggle = ({ expanded = false }: { expanded?: boolean }) => {
  const { theme, setTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <div className="flex items-center gap-2">
      {isDark ? (
        <span
          className="text-zinc-700 transition-transform duration-300 dark:text-white"
          aria-label="Dark mode"
        >
          <Moon className="h-5 w-5 scale-110 opacity-100" />
        </span>
      ) : (
        <span
          className="text-black transition-transform duration-300"
          aria-label="Light mode"
        >
          <Sun className="h-5 w-5 scale-110 opacity-100" />
        </span>
      )}
      <Switch
        checked={isDark}
        onCheckedChange={() => setTheme(isDark ? 'light' : 'dark')}
        className="data-[state=checked]:bg-white data-[state=unchecked]:bg-black"
        aria-label="Toggle theme"
      />
      {expanded && (
        <span className="text-md text-zinc-700 dark:text-white">Theme</span>
      )}
    </div>
  )
}

export default ThemeToggle
