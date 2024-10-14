import { serverTranslation } from '@/app/i18n'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'
import { Label } from '../ui/label'
import { LocationDialog } from './profile-location-dialog'

interface PageProps {
  params: {
    lng: string
  }
}

export async function ProfileLocation({ params: { lng } }: PageProps) {
  const { session, user } = await sessionService.validate()
  if (!session) return redirect(`${lng}/log-ind`)
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
