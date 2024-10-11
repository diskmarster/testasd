'use client'

import { useTranslation } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { LanguageContext } from '@/context/language'
import { useTheme } from 'next-themes'
import { useContext } from 'react'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const lng = useContext(LanguageContext)
  const { t } = useTranslation(lng, 'common')

  return (
    <Button
      variant='ghost'
      className='w-full flex justify-start items-center'
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}>
      {theme === 'light' ? (
        <>
          <Icons.sun className='mr-2 h-4 w-4' />
          <span className='capitalize'>{t('theme-toggle.theme')}</span>
        </>
      ) : (
        <>
          <Icons.moon className='mr-2 h-4 w-4' />
          <span className='capitalize'>{t('theme-toggle.theme')}</span>
        </>
      )}
    </Button>
  )
}
