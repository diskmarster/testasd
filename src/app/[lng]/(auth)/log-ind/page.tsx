import { SignInCard } from '@/components/auth/sign-in-card'
import { siteConfig } from '@/config/site'
import { Metadata } from 'next'

export const metadata: Metadata = {
	title: 'Log ind',
	description: `Log ind på ${siteConfig.name} og få styr på din beholdning.`,
}

interface PageProps {
	params: {
		lng: string
	}
	searchParams: {
		redirect?: string
	}
}

export default async function Page({
	params: { lng },
	searchParams: { redirect },
}: PageProps) {
	return (
		<section className='w-full'>
			<SignInCard lng={lng} redirect={redirect ?? null} />
		</section>
	)
}
