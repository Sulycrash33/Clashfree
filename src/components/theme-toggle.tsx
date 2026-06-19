'use client'

import * as React from 'react'
import { Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTheme } from '@/components/theme-provider'

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-9 w-9 rounded-lg border border-foreground/10 dark:border-foreground/10 light:border-muted hover:bg-foreground/5 dark:hover:bg-foreground/5 light:hover:bg-muted"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white dark:bg-muted border border-muted dark:border-foreground/10">
        <DropdownMenuItem
          onClick={() => setTheme('light')}
          className={`flex items-center gap-2 cursor-pointer ${
            theme === 'light'
              ? 'bg-secondary/10 text-secondary dark:text-secondary'
              : 'text-muted-foreground dark:text-muted-foreground'
          }`}
        >
          <Sun className="w-4 h-4" />
          Light
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-2 cursor-pointer ${
            theme === 'dark'
              ? 'bg-secondary/10 text-secondary dark:text-secondary'
              : 'text-muted-foreground dark:text-muted-foreground'
          }`}
        >
          <Moon className="w-4 h-4" />
          Dark
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => setTheme('system')}
          className={`flex items-center gap-2 cursor-pointer ${
            theme === 'system'
              ? 'bg-secondary/10 text-secondary dark:text-secondary'
              : 'text-muted-foreground dark:text-muted-foreground'
          }`}
        >
          <Monitor className="w-4 h-4" />
          System
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// Simple toggle button version
export function ThemeToggleSimple() {
  const { resolvedTheme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
      className="h-9 w-9 rounded-lg border border-foreground/10 dark:border-foreground/10 hover:bg-foreground/5 dark:hover:bg-foreground/5"
    >
      {resolvedTheme === 'dark' ? (
        <Sun className="h-4 w-4 text-accent-gold" />
      ) : (
        <Moon className="h-4 w-4 text-muted-foreground" />
      )}
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
