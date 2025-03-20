import { SiteWrapper } from "@/components/common/site-wrapper";
import { withAuth, WithAuthProps } from "@/components/common/with-auth";
import { Suspense } from "react";
import { DetailsWrapper } from "./details-wrapper";
import { DetailsSkeleton } from "@/components/orders/details";

interface Props extends WithAuthProps {
	params: { id: string }
}

async function Page({ params, user, customer }: Props) {
	return (
		<SiteWrapper>
			<Suspense fallback={<DetailsSkeleton />}>
				<DetailsWrapper id={params.id} customer={customer!} user={user} />
			</Suspense>
		</SiteWrapper>
	)
}

export default withAuth(Page, 'basis')
