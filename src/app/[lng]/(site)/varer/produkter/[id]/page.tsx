
import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { hasPermissionByRank } from '@/data/user.types'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { ProductDetailsWrapper } from './details-wrapper'
import { ProductFilesWrapper } from './files-wrapper'
import { ProductHistoryWrapper } from './history-wrapper'

interface PageProps {
	params: {
		lng: string
		id: string
	}
}

export default async function Page({ params: { lng, id } }: PageProps) {
	const { session, user } = await sessionService.validate()
	if (!session) {
		signOutAction()
		return
	}

	if (!hasPermissionByRank(user.role, 'læseadgang')) {
		redirect('/oversigt')
	}

	const { t } = await serverTranslation(lng, 'produkter')


	return (
		<SiteWrapper>
			<div className='flex flex-col lg:flex-row items-stretch gap-4 h-[500px]'>
				<Suspense fallback={<p>loading...</p>}>
					<ProductDetailsWrapper lng={lng} id={id} />
				</Suspense>
				<Suspense fallback={<p>loading...</p>}>
					<ProductFilesWrapper lng={lng} id={id} user={user} />
				</Suspense>
			</div>
			<div>
				<Suspense fallback={<p>loading...</p>}>
					<ProductHistoryWrapper customerID={user.customerID} lng={lng} id={id} />
				</Suspense>
			</div>
		</SiteWrapper>
	)
}
