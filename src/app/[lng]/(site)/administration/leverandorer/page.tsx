import { SiteWrapper } from "@/components/common/site-wrapper"
import { TableWrapper } from "./table-wrapper"
import { sessionService } from "@/service/session"
import { serverTranslation } from "@/app/i18n"
import { CreateSupplierModal } from "@/components/suppliers/create-modal"
import { DeleteSupplierModal } from "@/components/suppliers/delete-modal"

interface Props {
	params: {
		lng: string
	}
}

export default async function Page({ params: { lng } }: Props) {
	const { user } = await sessionService.validate()
	const { t } = await serverTranslation(lng, "leverandører")

	return (
		<SiteWrapper
			title={t("page.title")}
			description={t("page.desc")}
			actions={
				<>
					<CreateSupplierModal />
				</>
			}
		>
			<TableWrapper user={user!} />

			<DeleteSupplierModal />
		</SiteWrapper>
	)
}
