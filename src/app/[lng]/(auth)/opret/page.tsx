import { CreateCustomer } from '@/components/auth/create-customer'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Opret kunde',
}

interface PageProps {
	params: {
		lng: string
	}
}

export default async function Page({ params: { lng } }: PageProps) {
	return (
		<section className='w-full'>
			<CreateCustomer lng={lng} />
		</section>
	)
}
