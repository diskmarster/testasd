import { serverTranslation } from '@/app/i18n'
import { CreateApiKeyModal } from '@/components/clients/modal-create-apikey'
import { ModalCreateClient } from '@/components/clients/modal-create-client'
import { ModalDeleteClient } from '@/components/clients/modal-delete-client'
import { ModalImportClientHistory } from '@/components/clients/modal-import-history'
import { ModalImportClientInventory } from '@/components/clients/modal-import-inventory'
import { ModalToggleClient } from '@/components/clients/modal-toggle-client'
import { ModalUpdateClient } from '@/components/clients/modal-update-client'
import { ToggleIntegrationModal } from '@/components/clients/model-toggle-integration'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { SkeletonTable } from '@/components/common/skeleton-table'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { inventoryService } from '@/service/inventory'
import { Suspense } from 'react'
import { ClientTable } from './table'

interface Props extends WithAuthProps {
	params: { lng: string }
}

async function Page({ params: { lng } }: Props) {
	const { t } = await serverTranslation(lng, 'kunder')
	const units = await inventoryService.getActiveUnits()

	return (
		<SiteWrapper
			title={t('page.title')}
			description={t('page.description')}
			actions={
				<>
					<ModalCreateClient />
				</>
			}>
			<Suspense fallback={<SkeletonTable />}>
				<ClientTable />
			</Suspense>

			<ModalToggleClient />
			<ModalDeleteClient />
			<ModalUpdateClient />
			<ModalImportClientInventory />
			<ModalImportClientHistory units={units.map(u => u.name.toLowerCase())} />
			<CreateApiKeyModal />
			<ToggleIntegrationModal />
		</SiteWrapper>
	)
}

export default withAuth(Page, undefined, 'system_administrator')
