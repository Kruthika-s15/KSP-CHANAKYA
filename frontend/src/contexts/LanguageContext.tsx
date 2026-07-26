'use client';
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Language = 'en' | 'kn';

interface LanguageContextType {
  language: Language;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const translations: Record<string, Record<Language, string>> = {
  'Overview': { en: 'Overview', kn: 'ಅವಲೋಕನ' },
  'Biometric Search': { en: 'Biometric Search', kn: 'ಬಯೋಮೆಟ್ರಿಕ್ ಹುಡುಕಾಟ' },
  'Crime Network': { en: 'Crime Network', kn: 'ಅಪರಾಧ ಜಾಲ' },
  'Digital City Twin': { en: 'Digital City Twin', kn: 'ಡಿಜಿಟಲ್ ಸಿಟಿ ಟ್ವಿನ್' },
  'Platform Services': { en: 'Platform Services', kn: 'ಪ್ಲಾಟ್ಫಾರ್ಮ್ ಸೇವೆಗಳು' },
  'AI Assistant': { en: 'AI Assistant', kn: 'ಎಐ ಸಹಾಯಕ' },
  'Personnel': { en: 'Personnel', kn: 'ಸಿಬ್ಬಂದಿ' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    const storedLang = localStorage.getItem('language') as Language;
    if (storedLang === 'en' || storedLang === 'kn') {
      setLanguage(storedLang);
    }
  }, []);

  const toggleLanguage = () => {
    setLanguage((prev) => {
      const nextLang = prev === 'en' ? 'kn' : 'en';
      localStorage.setItem('language', nextLang);
      return nextLang;
    });
  };

  const t = (key: string) => {
    if (translations[key] && translations[key][language]) {
      return translations[key][language];
    }
    return key;
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
