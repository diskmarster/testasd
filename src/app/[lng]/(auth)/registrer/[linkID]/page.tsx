import { SignUpCard } from '@/components/auth/sign-up-card'
import { customerService } from '@/service/customer'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
	title: 'Registrer',
}

interface PageProps {
	params: {
		lng: string
	}
}

export default async function Page({
	params,
}: {
	params: { linkID: string; lng: string }
}) {
	const customer = await customerService.getByLinkID(params.linkID)

	if (!customer || !params.linkID) redirect(`/${params.lng}/log-ind`)

	return (
		<section className='w-full'>
			<SignUpCard customer={customer} linkID={params.linkID} lng={params.lng} />
		</section>
	)
}
