import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { Label } from '../ui/label'
import { LocationDialog } from './profile-location-dialog'

export async function ProfileLocation({ lng }: { lng: string }) {
	const { session, user } = await sessionService.validate()
	if (!session) {
		signOutAction()
		return
	}
	const locations = await locationService.getAllByUserID(user.id)
	const { t } = await serverTranslation(lng, 'profil')

	return (
		<div className='flex flex-row items-center justify-between rounded-md border p-4 md:max-w-lg'>
			<div className='grid gap-0.5'>
				<Label>{t('profile-location.primary-location')}</Label>
				<p className='text-sm text-muted-foreground'>
					{t('profile-location.primary-location-description')}
				</p>
			</div>
			<LocationDialog locations={locations} />
		</div>
	)
}
