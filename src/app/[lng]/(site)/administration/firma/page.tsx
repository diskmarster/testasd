import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n'
import { CompanyInfoTab } from '@/components/admin/tab-company-info'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { hasPermissionByRank } from '@/data/user.types'
import { customerService } from '@/service/customer'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

interface Props {
	params: {
		lng: string
	}
}

export default async function Page({ params: { lng } }: Props) {
	const { t } = await serverTranslation(lng, 'organisation')
	const { session, user } = await sessionService.validate()
	if (!session) {
		signOutAction()
		return
	}

	if (!hasPermissionByRank(user.role, 'moderator')) {
		redirect('/oversigt')
	}

	const customer = await customerService.getByID(user.customerID)
	if (!customer) {
		signOutAction()
		return
	}
	const settings = await customerService.getSettings(user.customerID)

	return (
		<SiteWrapper
			title={t('company-page.title')}
			description={t('company-page.description')}>
			<CompanyInfoTab customer={customer} settings={settings} />
		</SiteWrapper>
	)
}
