import { LanguageProvider } from '@/context/language'
import { dir } from 'i18next'
import { fallbackLng, I18NLanguage, languages, strIsI18NLanguage } from '../i18n/settings'

export async function generateStaticParams() {
  return languages.map(lng => ({ lng }))
}

interface RootLayoutProps {
  children: React.ReactNode
  params: {
    lng: string
  }
}

export default function RootLayout({
  children,
  params: { lng },
}: RootLayoutProps) {
  if (!strIsI18NLanguage(lng)) {
    lng = fallbackLng
  }

  return (
    <html lang={lng} dir={dir(lng)}>
      <head />
      <body>
        <LanguageProvider value={lng as I18NLanguage}>{children}</LanguageProvider>
      </body>
    </html>
  )
}
