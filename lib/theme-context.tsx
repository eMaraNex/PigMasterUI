"use client"

import type React from "react"
import { createContext, useContext, useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/lib/redux/hooks"
import { setTheme as setThemePreference } from "@/lib/redux/preferences/preferencesSlice"

type Theme = "light" | "dark"

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useAppSelector(state => state.preferences.theme)
  const dispatch = useAppDispatch()

  useEffect(() => {
    // Apply theme to document
    const root = document.documentElement
    if (theme === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }

  }, [theme])

  const toggleTheme = () => {
    dispatch(setThemePreference(theme === "light" ? "dark" : "light"))
  }

  const setTheme = (newTheme: Theme) => {
    dispatch(setThemePreference(newTheme))
  }

  return <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider")
  }
  return context
}
