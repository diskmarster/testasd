import { withAuth, WithAuthProps } from "@/components/common/with-auth"
import { Suspense } from "react"
import { MailSettingWrapper } from "./mail-wrapper"

interface Props extends WithAuthProps {
	params: {
		lng: string
	}
}

async function Page({ customer, user }: Props) {
	return (
		<div className="space-y-4">
			<Suspense fallback={<p>loading mail settings...</p>}>
				<MailSettingWrapper customer={customer} user={user} />
			</Suspense>
		</div>
	)
}

export default withAuth(Page, 'lite', 'moderator')
