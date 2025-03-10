'use client'

import { fallbackLng, I18NLanguage } from '@/app/i18n/settings'
import React, { createContext } from 'react'

export const LanguageContext = createContext<I18NLanguage>(fallbackLng)

export const useLanguage = () => React.useContext(LanguageContext)

export const LanguageProvider = ({
  value,
  children,
}: React.PropsWithChildren<{ value: I18NLanguage }>) => {
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
