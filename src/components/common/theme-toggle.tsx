'use client'

import { useTranslation } from '@/app/i18n/client'
import { Icons } from '@/components/ui/icons'
import { LanguageContext } from '@/context/language'
import { useTheme } from 'next-themes'
import { useContext } from 'react'
import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '../ui/dropdown-menu'

export function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  const lng = useContext(LanguageContext)
  const { t } = useTranslation(lng, 'common')

  const handleThemeChange = (newTheme: string, e: React.MouseEvent) => {
    e.preventDefault() // Prevents dropdown from closing
    setTheme(newTheme)
  }

  return (
    <>
      <DropdownMenuSubTrigger className='flex items-center'>
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
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          <DropdownMenuItem
            onClick={e => handleThemeChange('light', e)} >
           
            <Icons.sun className='mr-2 h-4 w-4' />
            <span>{t('theme-toggle.light')}</span>
            {theme === 'light' && <Icons.check className='ml-auto h-4 w-4' />}
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={e => handleThemeChange('dark', e)} >
            
            <Icons.moon className='mr-2 h-4 w-4' />
            <span>{t('theme-toggle.dark')}</span>
            {theme === 'dark' && <Icons.check className='ml-auto h-4 w-4' />}
          </DropdownMenuItem>
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </>
  )
}
