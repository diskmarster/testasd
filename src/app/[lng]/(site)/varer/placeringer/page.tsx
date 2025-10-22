import { serverTranslation } from '@/app/i18n'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { ModalCreatePlacement } from '@/components/inventory/modal-create-placement'
import { ModalPlacementLabel } from '@/components/inventory/modal-placement-label'
import { TablePlacement } from '@/components/inventory/table-placements'
import { ImportPlacementsModal } from '@/components/placements/import-modal'
import { hasPermissionByRank } from '@/data/user.types'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { redirect } from 'next/navigation'

interface PageProps extends WithAuthProps {
	params: {
		lng: string
	}
}

async function Page({ params: { lng }, user, pathname }: PageProps) {
	const location = await locationService.getLastVisited(user.id!)
	if (!location) redirect(`/${lng}/log-ind?redirect=${pathname}`)

	const allPlacement = await inventoryService.getAllPlacementsByID(location)
	const { t } = await serverTranslation(lng, 'placeringer')

	return (
		<SiteWrapper
			title={t('placement-page.title')}
			description={t('placement-page.description')}
			actions={
				<>
					{hasPermissionByRank(user.role, 'bruger') && (
						<ImportPlacementsModal />
					)}
					{hasPermissionByRank(user.role, 'bruger') && <ModalCreatePlacement />}
				</>
			}>
			<TablePlacement data={allPlacement} user={user} />

			<ModalPlacementLabel />
		</SiteWrapper>
	)
}

export default withAuth(Page, undefined, 'læseadgang')
