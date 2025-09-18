import { SiteWrapper } from '@/components/common/site-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { ProfileDelete } from '@/components/profile/profile-delete'
import { ProfileHeader } from '@/components/profile/profile-header'
import { ProfileInformation } from '@/components/profile/profile-information'
import { ProfileLocation } from '@/components/profile/profile-location'
import { ProfilePassword } from '@/components/profile/profile-password'
import { ProfilePin } from '@/components/profile/profile-pin'
import { Separator } from '@/components/ui/separator'

interface PageProps extends WithAuthProps {
	params: {
		lng: string
	}
}

export const metadata = {
	title: 'Min profil',
}

async function Page({ params: { lng } }: PageProps) {
	return (
		<SiteWrapper>
			<ProfileHeader />
			<Separator className='my-4' />
			<ProfileInformation />
			<ProfileLocation lng={lng} />
			<ProfilePassword />
			<ProfileDelete />
			<ProfilePin />
		</SiteWrapper>
	)
}

export default withAuth(Page)
