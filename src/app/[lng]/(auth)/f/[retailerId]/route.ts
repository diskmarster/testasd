import { cookieName, fallbackLng, languages } from '@/app/i18n/settings'
import acceptLanguage from 'accept-language'
import { addDays } from 'date-fns'
import { cookies, headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'
import { env } from 'process'

acceptLanguage.languages(languages)

export async function GET(
	r: NextRequest,
	{ params }: { params: { retailerId: string } },
) {
	const cookieStore = cookies()
	cookieStore.set('retailer', params.retailerId, {
		expires: addDays(new Date(), 30),
		secure: env.NODE_ENV == 'production',
		sameSite: 'lax',
		httpOnly: true,
	})
	const headerStore = headers()

	let lng: string | undefined | null
	if (cookieStore.has(cookieName))
		lng = acceptLanguage.get(cookieStore.get(cookieName)?.value)
	if (!lng) lng = acceptLanguage.get(headerStore.get('Accept-Language'))
	if (!lng) lng = fallbackLng

	redirect(`/${lng}/opret`)
}
