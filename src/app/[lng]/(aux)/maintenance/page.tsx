import { serverTranslation } from '@/app/i18n'
import { Icons } from '@/components/ui/icons'
import { isMaintenanceMode } from '@/lib/utils.server'
import { redirect } from 'next/navigation'

export default async function Page({ params }: { params: { lng: string } }) {
	const { t } = await serverTranslation(params.lng, 'maintenance')

	if (!isMaintenanceMode()) {
		redirect(`/${params.lng}/oversigt`)
	}

	return (
		<div className='container grid place-items-center overflow-x-hidden'>
			<div className='flex flex-col gap-4 max-w-[45ch] text-center'>
				<div className='flex flex-col items-center gap-8'>
					<Icons.trafficCone className='size-16 text-orange-500 animate-bounce' />
					<div className='space-y-2'>
						<h1 className='text-xl font-semibold'>{t('title')}</h1>
						<p className='text-sm'>{t('sub')}</p>
					</div>
				</div>
			</div>
		</div>
	)
}
