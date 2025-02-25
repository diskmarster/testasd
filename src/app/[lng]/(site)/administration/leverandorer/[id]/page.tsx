import { signOutAction } from "@/app/[lng]/(auth)/log-ud/actions";
import { SiteWrapper } from "@/components/common/site-wrapper";
import { sessionService } from "@/service/session";
import { Suspense } from "react";
import { DetailsWrapper } from "./details-wrapper";
import { SupplierHistoryWrapper } from "./history-wrapper";
import { Separator } from "@/components/ui/separator";
import { SupplierDetailsSkeleton } from "@/components/suppliers/details";
import { SupplierHistorySkeleton } from "@/components/suppliers/history";

interface Props {
	params: {
		lng: string
		id: string
	}
}

export default async function Page({ params: { lng, id } }: Props) {
	const { session, user } = await sessionService.validate()
	if (!session) {
		signOutAction()
		return
	}
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
