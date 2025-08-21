import { withAuth, WithAuthProps } from "@/components/common/with-auth"
import { Suspense } from "react"
import { IntegrationsWrapper } from "./integrations-wrapper"
import { DeleteSettingModal } from "@/components/admin/mail-settings"
import { serverTranslation } from "@/app/i18n"

interface Props extends WithAuthProps {
	params: {
		lng: string
	}
}

async function Page({ customer, user, params: { lng } }: Props) {
	const { t } = await serverTranslation(lng, 'organisation', { keyPrefix: 'integrations' })
	return (
		<div className="space-y-4">
			{customer.canUseIntegration ? (
				<Suspense>
					<IntegrationsWrapper user={user} />
				</Suspense>
			) : (
				<p className="text-sm text-muted-foreground">{t("not-active-for-customer")}</p>
			)}
			<Suspense>
				<DeleteSettingModal />
			</Suspense>
		</div>
	)
}

export default withAuth(Page, 'lite', 'moderator')
