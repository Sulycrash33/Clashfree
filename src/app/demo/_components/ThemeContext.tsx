"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface ThemeContextValue {
  darkMode: boolean;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  darkMode: false,
  toggleDark: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Default: dark mode (matches the rest of ClashFree)
  const [darkMode, setDarkMode] = useState(true);

  // Persist in localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("clashfree-demo-dark");
      if (saved !== null) setDarkMode(saved === "true");
    } catch {}
  }, []);

  const toggleDark = () => {
    setDarkMode(prev => {
      const next = !prev;
      try { localStorage.setItem("clashfree-demo-dark", String(next)); } catch {}
      return next;
    });
  };

  return (
    <ThemeContext.Provider value={{ darkMode, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
