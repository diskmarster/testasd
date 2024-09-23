import { SiteWrapper } from '@/components/common/site-wrapper'
import { ProfileDelete } from '@/components/profile/profile-delete'
import { ProfileHeader } from '@/components/profile/profile-header'
import { ProfileInformation } from '@/components/profile/profile-information'
import { ProfileLocation } from '@/components/profile/profile-location'
import { ProfilePassword } from '@/components/profile/profile-password'
import { ProfilePin } from '@/components/profile/profile-pincode'
import { Separator } from '@/components/ui/separator'

export const metadata = {
  title: 'Min profil',
}

export default async function Page() {
  return (
    <SiteWrapper>
      <ProfileHeader />
      <Separator className='my-4' />
      <ProfileInformation />
      <ProfileLocation />
      <ProfilePassword />
      <ProfileDelete />
      <ProfilePin />
    </SiteWrapper>
  )
}
