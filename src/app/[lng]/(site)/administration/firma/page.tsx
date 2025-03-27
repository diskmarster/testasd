import { serverTranslation } from '@/app/i18n'
import { CompanyInfoSkeleton } from '@/components/admin/tab-company-info'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { Suspense } from 'react'
import { CompanyInfoWrapper } from './company-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { MailSettingWrapper } from './mail-wrapper'

interface Props extends WithAuthProps {
	params: {
		lng: string
	}
}

async function Page({ params: { lng }, customer, user }: Props) {
	const { t } = await serverTranslation(lng, 'organisation')

	return (
		<SiteWrapper
			title={t('company-page.title')}
			description={t('company-page.description')}>
			<Suspense fallback={<CompanyInfoSkeleton plan={customer.plan} />}>
				<CompanyInfoWrapper customer={customer} />
			</Suspense>
			<Suspense fallback={<p>loading mail settings...</p>}>
				<MailSettingWrapper customer={customer} user={user} />
			</Suspense>
		</SiteWrapper>
	)
}

export default withAuth(Page, 'lite', 'moderator')
