import { serverTranslation } from '@/app/i18n'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import {
	LocationMoveServerWrapper,
	LocationMoveSkeleton,
} from '@/components/location-move/location-move-server-wrapper'
import { Suspense } from 'react'

namespace Page {
	export interface Props extends WithAuthProps {
		params: {
			lng: string
		}
	}
}

async function Page({ params, user }: Page.Props) {
	const { t } = await serverTranslation(params.lng, 'lokations-flyt')

	return (
		<SiteWrapper title={t('page.title')} description={t('page.description')}>
			<Suspense fallback={<LocationMoveSkeleton />}>
				<LocationMoveServerWrapper user={user} />
			</Suspense>
		</SiteWrapper>
	)
}

export default withAuth(Page, undefined, 'moderator')
