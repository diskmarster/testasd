'use client'

import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { usePathname } from 'next/navigation'
import ReactCountryFlag from 'react-country-flag'
import { languages } from '../../app/i18n/settings'

interface LanguageSwitcherProps {
  lng: string
}

const languageData: { [key: string]: { name: string; code: string } } = {
  da: { name: 'DK', code: 'DK' },
  en: { name: 'EN', code: 'GB' },
}

export const LanguageSwitcher = ({ lng }: LanguageSwitcherProps) => {
  const pathname = usePathname()

  const createNewPath = (newLang: string) => {
    return `/${newLang}${pathname.replace(`/${lng}`, '')}`
  }

  return (
    <Select
      defaultValue={lng}
      onValueChange={(value: string) => {
        window.location.href = createNewPath(value)
      }}>
      <SelectTrigger className='max-w-44'>
        <SelectValue placeholder='Vælg sprog' />
      </SelectTrigger>
      <SelectContent align='end'>
        <SelectGroup>
          <SelectLabel className='text-sm font-semibold'>
            <div className='flex items-center gap-4 justify-between'>
              <p>Vælg sprog</p>
            </div>
          </SelectLabel>
          <SelectSeparator />
          {languages.map(language => (
            <SelectItem key={language} value={language}>
              <div className='flex items-center gap-2'>
                <ReactCountryFlag
                  countryCode={languageData[language].code}
                  svg
                  style={{
                    width: '1.5em',
                    height: '1.5em',
                  }}
                  title={languageData[language].name}
                />
                <p>{languageData[language].name}</p>
              </div>
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}

export default LanguageSwitcher
