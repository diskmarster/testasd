export const fallbackLng = 'da'
export const languages: ('da' | 'en')[] = [fallbackLng, 'en']
export const defaultNS = ['common']
export const cookieName = 'i18next'

export function getOptions(
  lng = fallbackLng,
  ns: string | string[] = defaultNS,
) {
  return {
    supportedLngs: languages,

    fallbackLng,
    lng,
    fallbackNS: defaultNS,
    defaultNS,
    ns,
  }
}
