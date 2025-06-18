import { serverTranslation } from "@/app/i18n"
import { SiteWrapper } from "@/components/common/site-wrapper"
import { SkeletonTable } from "@/components/common/skeleton-table"
import { Suspense } from "react"
import { ClientTable } from "./table"
import { ModalCreateClient } from "@/components/clients/modal-create-client"
import { ModalToggleClient } from "@/components/clients/modal-toggle-client"
import { ModalDeleteClient } from "@/components/clients/modal-delete-client"
import { ModalUpdateClient } from "@/components/clients/modal-update-client"
import { ModalImportClientInventory } from "@/components/clients/modal-import-inventory"
import { ModalImportClientHistory } from "@/components/clients/modal-import-history"
import { withAuth, WithAuthProps } from "@/components/common/with-auth"
import { CreateApiKeyModal } from "@/components/clients/modal-create-apikey"
import { inventoryService } from "@/service/inventory"

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
		</SiteWrapper>
	)
}

export default withAuth(Page, undefined, 'system_administrator')
