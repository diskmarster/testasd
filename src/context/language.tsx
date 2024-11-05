'use client'

import { fallbackLng } from '@/app/i18n/settings'
import React, { createContext } from 'react'

export const LanguageContext = createContext<string>(fallbackLng)

export const useLanguage = () => React.useContext(LanguageContext)

export const LanguageProvider = ({
  value,
  children,
}: React.PropsWithChildren<{ value: string }>) => {
  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}
