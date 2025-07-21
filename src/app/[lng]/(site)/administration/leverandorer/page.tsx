import { SiteWrapper } from "@/components/common/site-wrapper"
import { TableWrapper } from "./table-wrapper"
import { serverTranslation } from "@/app/i18n"
import { CreateSupplierModal } from "@/components/suppliers/create-modal"
import { DeleteSupplierModal } from "@/components/suppliers/delete-modal"
import { withAuth, WithAuthProps } from "@/components/common/with-auth"

interface Props extends WithAuthProps {
	params: {
		lng: string
	}
}

async function Page({ params: { lng }, user }: Props) {
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

export default withAuth(Page)
