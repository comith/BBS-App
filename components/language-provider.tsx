"use client"

import type React from "react"

import { createContext, useState, useEffect } from "react"
import { translations } from "@/lib/translations"

type Language = "en" | "th"

type LanguageContextType = {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

export const LanguageContext = createContext<LanguageContextType>({
  language: "th",
  setLanguage: () => {},
  t: (key) => key,
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("en")

  useEffect(() => {
    const storedLanguage = localStorage.getItem("bbs-language") as Language
    if (storedLanguage && (storedLanguage === "en" || storedLanguage === "th")) {
      setLanguageState(storedLanguage)
    }
  }, [])

  const setLanguage = (lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("bbs-language", lang)
  }

  const t = (key: string): string => {
    return (translations[language] as Record<string, string>)[key] || key
  }

  return <LanguageContext.Provider value={{ language, setLanguage, t }}>{children}</LanguageContext.Provider>
}
