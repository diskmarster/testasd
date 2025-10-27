'use client'

import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { useRouter } from 'next/navigation'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'

export function SmartphoneBackButton() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'smartphone')
	const router = useRouter()
	return (
		<Button
			variant='outline'
			className='w-fit'
			onClick={() => router.replace('/m')}>
			<Icons.arrowLeft className='size-3.5 mr-2' />
			{t('backButton')}
		</Button>
	)
}
