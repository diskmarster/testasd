import { CompanyInfoSkeleton } from "@/components/admin/tab-company-info"
import { withAuth, WithAuthProps } from "@/components/common/with-auth"
import { Suspense } from "react"
import { CompanyInfoWrapper } from "./company-wrapper"

interface Props extends WithAuthProps {
	params: {
		lng: string
	}
}

async function Page({ customer }: Props) {
	return (
		<div className="space-y-4">
			<Suspense fallback={<CompanyInfoSkeleton plan={customer.plan} />}>
				<CompanyInfoWrapper customer={customer} />
			</Suspense>
		</div>
	)
}

export default withAuth(Page, 'lite', 'moderator')
