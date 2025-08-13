import { serverTranslation } from '@/app/i18n'
import { DeleteSettingModal } from '@/components/admin/mail-settings'
import { CompanyInfoSkeleton } from '@/components/admin/tab-company-info'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { Suspense } from 'react'
import { CompanyInfoWrapper } from './company-wrapper'
import { IntegrationsWrapper } from './integrations-wrapper'
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
			{customer.canUseIntegration && (
				<Suspense>
					<IntegrationsWrapper user={user} />
				</Suspense>
			)}
			<Suspense>
				<DeleteSettingModal />
			</Suspense>
		</SiteWrapper>
	)
}

export default withAuth(Page, 'lite', 'moderator')
