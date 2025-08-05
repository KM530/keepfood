import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface LanguageContextType {
  language: string;
  setLanguage: (language: string) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  "zh-CN": {
    "themeSettings": "主题设置",
    "languageSettings": "语言设置",
    "help": "使用帮助",
    "lightMode": "浅色模式",
    "darkMode": "深色模式",
    "chinese": "简体中文",
    "english": "English",
  },
  "en-US": {
    "themeSettings": "Theme Settings",
    "languageSettings": "Language Settings",
    "help": "Help",
    "lightMode": "Light Mode",
    "darkMode": "Dark Mode",
    "chinese": "简体中文",
    "english": "English",
  }
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState("zh-CN");

  useEffect(() => {
    AsyncStorage.getItem("app_language").then((savedLanguage) => {
      if (savedLanguage) {
        setLanguageState(savedLanguage);
      }
    });
  }, []);

  const setLanguage = (newLanguage: string) => {
    setLanguageState(newLanguage);
    AsyncStorage.setItem("app_language", newLanguage);
  };

  const t = (key: string): string => {
    const currentTranslations = translations[language as keyof typeof translations] || translations["zh-CN"];
    return currentTranslations[key as keyof typeof currentTranslations] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
