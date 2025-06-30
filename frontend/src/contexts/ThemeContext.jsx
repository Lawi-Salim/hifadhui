"use client"

import { createContext, useState, useContext, useEffect } from "react"

const ThemeContext = createContext()

export const useTheme = () => useContext(ThemeContext)

export const ThemeProvider = ({ children }) => {
  // Récupérer le thème depuis le localStorage ou utiliser le thème système par défaut
  const getInitialTheme = () => {
    const savedTheme = localStorage.getItem("theme")
    if (savedTheme) {
      return savedTheme
    }

    // Vérifier les préférences du système
    if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
      return "dark"
    }

    return "light"
  }

  const [theme, setTheme] = useState(getInitialTheme)

  // Appliquer le thème au document
  useEffect(() => {
    const root = window.document.documentElement

    // Supprimer les classes de thème existantes
    root.classList.remove("light", "dark")

    // Ajouter la classe de thème appropriée
    if (theme === "system") {
      const systemTheme =
        window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
      root.classList.add(systemTheme)
    } else {
      root.classList.add(theme)
    }

    // Sauvegarder le thème dans le localStorage
    localStorage.setItem("theme", theme)
  }, [theme])

  // Écouter les changements de préférences système
  useEffect(() => {
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")

      const handleChange = () => {
        const root = window.document.documentElement
        root.classList.remove("light", "dark")
        root.classList.add(mediaQuery.matches ? "dark" : "light")
      }

      mediaQuery.addEventListener("change", handleChange)
      return () => mediaQuery.removeEventListener("change", handleChange)
    }
  }, [theme])

  const value = {
    theme,
    setTheme,
    isSystemTheme: theme === "system",
    isDarkTheme:
      theme === "dark" ||
      (theme === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches),
    isLightTheme:
      theme === "light" ||
      (theme === "system" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches === false),
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

