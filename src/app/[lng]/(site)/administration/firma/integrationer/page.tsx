import { withAuth, WithAuthProps } from "@/components/common/with-auth"
import { Suspense } from "react"
import { IntegrationsWrapper } from "./integrations-wrapper"
import { DeleteSettingModal } from "@/components/admin/mail-settings"

interface Props extends WithAuthProps {
	params: {
		lng: string
	}
}

async function Page({ customer, user }: Props) {
	return (
		<div className="space-y-4">
			{customer.canUseIntegration && (
				<Suspense>
					<IntegrationsWrapper user={user} />
				</Suspense>
			)}
			<Suspense>
				<DeleteSettingModal />
			</Suspense>
		</div>
	)
}

export default withAuth(Page, 'lite', 'moderator')
