"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return null
  }

  const isDark = theme === "dark"

  return (
    <button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      className={cn(
        "relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        isDark
          ? "bg-foreground/90" // Dark track when dark mode is active
          : "bg-muted" // Light track when light mode is active
      )}
      aria-label="Toggle theme"
    >
      {/* Handle */}
      <span
        className={cn(
          "absolute inline-block h-5 w-5 transform rounded-full shadow-sm transition-transform duration-200 ease-in-out z-10",
          isDark 
            ? "translate-x-6 bg-background" // White handle when dark mode
            : "translate-x-0.5 bg-foreground" // Dark handle when light mode
        )}
      >
        {/* Gradient overlay for 3D effect */}
        <span className={cn(
          "absolute inset-0 rounded-full",
          isDark 
            ? "bg-gradient-to-br from-white/30 to-transparent"
            : "bg-gradient-to-br from-gray-300/30 to-transparent"
        )} />
      </span>

      {/* Icons */}
      <div className="flex w-full items-center justify-between px-1.5 relative z-0">
        {/* Moon icon with stars (dark mode) */}
        <div className={cn(
          "flex items-center gap-0.5 transition-opacity duration-200",
          isDark ? "opacity-100" : "opacity-0"
        )}>
          <Moon className="h-3 w-3 text-background" />
          <div className="flex gap-0.5">
            <span className="h-0.5 w-0.5 rounded-full bg-background" />
            <span className="h-0.5 w-0.5 rounded-full bg-background" />
          </div>
        </div>

        {/* Sun icon (light mode) */}
        <div className={cn(
          "flex items-center transition-opacity duration-200",
          !isDark ? "opacity-100" : "opacity-0"
        )}>
          <Sun className="h-3.5 w-3.5 text-foreground" />
        </div>
      </div>
    </button>
  )
}

