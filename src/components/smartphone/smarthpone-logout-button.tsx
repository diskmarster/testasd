'use client'

import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { Icons } from '../ui/icons'

export function SmartphoneLogoutButton() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'smartphone')
	return (
		<button
			onClick={() => signOutAction()}
			className='border text-left mt-auto rounded-lg shadow-md flex h-14'>
			<div className='grid place-items-center bg-accent rounded-lg rounded-r-none w-16 aspect-square border-r'>
				<Icons.logout className='size-6 text-destructive' />
			</div>
			<p className='self-center w-full px-3'>{t('logOut')}</p>
		</button>
	)
}
