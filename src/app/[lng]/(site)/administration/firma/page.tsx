import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n'
import { CompanyInfoSkeleton, CompanyInfoTab } from '@/components/admin/tab-company-info'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { hasPermissionByRank } from '@/data/user.types'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { CompanyInfoWrapper } from './company-wrapper'

interface Props {
	params: {
		lng: string
	}
}

export default async function Page({ params: { lng } }: Props) {
	const { t } = await serverTranslation(lng, 'organisation')
	const { session, user, customer } = await sessionService.validate()
	if (!session || !user || !customer) {
		signOutAction()
		return
	}

	if (!hasPermissionByRank(user.role, 'moderator')) {
		redirect('/oversigt')
	}

	return (
		<SiteWrapper
			title={t('company-page.title')}
			description={t('company-page.description')}>
			<Suspense fallback={<CompanyInfoSkeleton />}>
				<CompanyInfoWrapper customer={customer} />
			</Suspense>
		</SiteWrapper>
	)
}
