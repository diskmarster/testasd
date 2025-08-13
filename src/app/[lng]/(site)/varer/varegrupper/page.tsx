import { serverTranslation } from '@/app/i18n'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { ModalCreateProductGroup } from '@/components/inventory/modal-create-group'
import { TableProductGroups } from '@/components/inventory/table-product-groups'
import { hasPermissionByRank } from '@/data/user.types'
import { integrationsService } from '@/service/integrations'
import { inventoryService } from '@/service/inventory'

interface PageProps extends WithAuthProps {
	params: {
		lng: string
	}
}

async function Page({ params: { lng }, user, customer }: PageProps) {
	const groups = await inventoryService.getAllGroupsByID(customer.id)
	const integrationsSettings = await integrationsService.getSettings(
		customer.id,
	)

	const { t } = await serverTranslation(lng, 'varegrupper')

	return (
		<SiteWrapper
			title={t('product-group-page.title')}
			description={t('product-group-page.description')}
			actions={
				<>
					{hasPermissionByRank(user.role, 'bruger') &&
						!integrationsSettings?.useSyncProducts && (
							<ModalCreateProductGroup />
						)}
				</>
			}>
			<TableProductGroups
				groups={groups}
				user={user}
				integrationSettings={integrationsSettings}
			/>
		</SiteWrapper>
	)
}

export default withAuth(Page, undefined, 'læseadgang')
