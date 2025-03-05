
import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { hasPermissionByPlan, hasPermissionByRank } from '@/data/user.types'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { ProductDetailsWrapper } from './details-wrapper'
import { ProductFilesWrapper } from './files-wrapper'
import { ProductHistoryWrapper } from './history-wrapper'
import { DetailsSkeleton } from '@/components/products/product-details'
import { FilesSkeleton } from '@/components/products/product-files-grid'
import { HistorySkeleton } from '@/components/products/product-history'
import { ReorderWrapper } from './reorder-wrapper'

interface PageProps {
	params: {
		lng: string
		id: string
	}
}

export default async function Page({ params: { lng, id } }: PageProps) {
	const { session, user, customer } = await sessionService.validate()
	if (!session) {
		signOutAction()
		return
	}

	if (!hasPermissionByRank(user.role, 'læseadgang')) {
		redirect('/oversigt')
	}

	return (
		<SiteWrapper>
			<div className='flex flex-col lg:flex-row items-stretch gap-4'>
				<Suspense fallback={<DetailsSkeleton />}>
					<ProductDetailsWrapper lng={lng} id={id} user={user} />
				</Suspense>
			</div>
			<div className='flex flex-col lg:flex-row items-stretch gap-4 lg:h-96'>
				<Suspense fallback={<FilesSkeleton />}>
					<ProductFilesWrapper lng={lng} id={id} user={user} />
				</Suspense>
				{hasPermissionByPlan(customer.plan, 'basis') && (
					<Suspense fallback={<FilesSkeleton />}>
						<ReorderWrapper lng={lng} id={id} user={user} />
					</Suspense>
				)}
			</div>
			<div>
				<Suspense fallback={<HistorySkeleton />}>
					<ProductHistoryWrapper customerID={user.customerID} lng={lng} id={id} />
				</Suspense>
			</div>
		</SiteWrapper>
	)
}
