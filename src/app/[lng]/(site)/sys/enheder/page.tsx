import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { ModalCreateUnit } from '@/components/inventory/modal-create-unit'
import { UnitOverview } from '@/components/inventory/table-units'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'

interface pageprops extends WithAuthProps {
	params: {
		lng: string
	}
}

async function Page({ params: { lng }, user }: pageprops) {
	const location = await locationService.getLastVisited(user.id)
	if (!location) {
		await signOutAction()
		return null
	}

	const units = await inventoryService.getAllUnits()
	const { t } = await serverTranslation(lng, 'enheder')

	return (
		<SiteWrapper
			title={t('unit-page.unit-title')}
			description={t('unit-page.unit-description')}
			actions={
				<>
					<ModalCreateUnit />
				</>
			}>
			<UnitOverview units={units} user={user} />
		</SiteWrapper>
	)
}

export default withAuth(Page, undefined, 'system_administrator')
