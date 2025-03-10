export type I18NLanguage = 'da' | 'en'
export const fallbackLng: I18NLanguage = 'da'
export const languages: I18NLanguage[] = [fallbackLng, 'en']
export const defaultNS = ['common']
export const cookieName = 'i18next'

export function getOptions(
  lng = fallbackLng,
  ns: string | string[] = defaultNS,
) {
  return {
    supportedLngs: languages,
    interpolation: {
      skipOnVariables: false,
    },
    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  }
}

export function strIsI18NLanguage(str: string): str is I18NLanguage {
  //@ts-ignore
  return languages.includes(str)
}
