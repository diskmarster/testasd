import { SiteWrapper } from "@/components/common/site-wrapper";
import { Suspense } from "react";
import { DetailsWrapper } from "./details-wrapper";
import { SupplierHistoryWrapper } from "./history-wrapper";
import { Separator } from "@/components/ui/separator";
import { SupplierDetailsSkeleton } from "@/components/suppliers/details";
import { SupplierHistorySkeleton } from "@/components/suppliers/history";
import { withAuth, WithAuthProps } from "@/components/common/with-auth";

interface Props extends WithAuthProps {
	params: {
		lng: string
		id: string
	}
}

async function Page({ params: { id }, user }: Props) {
	return (
		<SiteWrapper>
			<div className='flex flex-col lg:flex-row items-stretch gap-4'>
				<Suspense fallback={<SupplierDetailsSkeleton />}>
					<DetailsWrapper id={parseInt(id)} customerID={user.customerID} />
				</Suspense>
			</div>
			<Separator />
			<div>
				<Suspense fallback={<SupplierHistorySkeleton />}>
					<SupplierHistoryWrapper customerID={user.customerID} id={parseInt(id)} />
				</Suspense>
			</div>
		</SiteWrapper>
	)
}

export default withAuth(Page)
