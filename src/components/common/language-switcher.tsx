'use client'

import { useTranslation } from '@/app/i18n/client'
import { usePathname } from 'next/navigation'
import ReactCountryFlag from 'react-country-flag'
import { languages } from '../../app/i18n/settings'
import {
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '../ui/dropdown-menu'
import { Icons } from '../ui/icons'

interface LanguageSwitcherProps {
  lng: string
}

export const LanguageSwitcher = ({ lng }: LanguageSwitcherProps) => {
  const pathname = usePathname()
  const { t } = useTranslation(lng, 'common')

  const languageData: {
    [key: string]: { name: string; fullName: string; code: string }
  } = {
    da: {
      name: 'DK',
      fullName: t('language-switcher.full-lang-name-da'),
      code: 'DK',
    },
    en: {
      name: 'EN',
      fullName: t('language-switcher.full-lang-name-en'),
      code: 'GB',
    },
  }

  const createNewPath = (newLang: string) => {
    return `/${newLang}${pathname.replace(`/${lng}`, '')}`
  }

  return (
    <>
      <DropdownMenuSubTrigger className='flex items-center'>
        <ReactCountryFlag
          countryCode={languageData[lng].code}
          svg
          style={{
            width: '17px',
            height: '17px',
            borderRadius: '6px',
          }}
          title={languageData[lng].name}
        />
        <span className='ml-2'>{t('language-switcher.language')}</span>
      </DropdownMenuSubTrigger>
      <DropdownMenuPortal>
        <DropdownMenuSubContent>
          {languages.map(language => (
            <DropdownMenuItem
              key={language}
              onClick={() => {
                window.location.href = createNewPath(language)
              }}>
              <ReactCountryFlag
                countryCode={languageData[language].code}
                svg
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '6px',
                }}
                title={languageData[language].name}
                className='mr-2'
              />
              <span>{languageData[language].fullName}</span>
              {language === lng && <Icons.check className='ml-4 h-4 w-4' />}
            </DropdownMenuItem>
          ))}
        </DropdownMenuSubContent>
      </DropdownMenuPortal>
    </>
  )
}
