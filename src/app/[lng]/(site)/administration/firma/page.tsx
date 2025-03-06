import { serverTranslation } from '@/app/i18n'
import { CompanyInfoSkeleton } from '@/components/admin/tab-company-info'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { Suspense } from 'react'
import { CompanyInfoWrapper } from './company-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'

interface Props extends WithAuthProps {
	params: {
		lng: string
	}
}

async function Page({ params: { lng }, customer }: Props) {
	const { t } = await serverTranslation(lng, 'organisation')

	return (
		<SiteWrapper
			title={t('company-page.title')}
			description={t('company-page.description')}>
			<Suspense fallback={<CompanyInfoSkeleton plan={customer.plan} />}>
				<CompanyInfoWrapper customer={customer} />
			</Suspense>
		</SiteWrapper>
	)
}

export default withAuth(Page, 'lite', 'moderator')
