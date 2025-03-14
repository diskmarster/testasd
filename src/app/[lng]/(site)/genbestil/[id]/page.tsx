import { SiteWrapper } from "@/components/common/site-wrapper";
import { withAuth, WithAuthProps } from "@/components/common/with-auth";
import { formatDate } from "@/lib/utils";
import { Suspense } from "react";
import { DetailsWrapper } from "./details-wrapper";

interface Props extends WithAuthProps {
	params: { id: string }
}

async function Page({ params, user }: Props) {
	return (
		<SiteWrapper>
			<Suspense fallback={<p>loading...</p>}>
				<DetailsWrapper id={params.id} customerID={user.customerID} />
			</Suspense>
		</SiteWrapper>
	)
}

export default withAuth(Page, 'basis')
