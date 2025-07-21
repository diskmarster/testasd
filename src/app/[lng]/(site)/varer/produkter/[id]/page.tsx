import { SiteWrapper } from '@/components/common/site-wrapper'
import { hasPermissionByPlan } from '@/data/user.types'
import { Suspense } from 'react'
import { ProductDetailsWrapper } from './details-wrapper'
import { ProductFilesWrapper } from './files-wrapper'
import { ProductHistoryWrapper } from './history-wrapper'
import { DetailsSkeleton } from '@/components/products/product-details'
import { FilesSkeleton } from '@/components/products/product-files-grid'
import { HistorySkeleton } from '@/components/products/product-history'
import { ReorderWrapper } from './reorder-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { ProductInventoryWrapper } from './placement-wrapper'

interface PageProps extends WithAuthProps {
	params: {
		lng: string
		id: string
	}
}

async function Page({ params: { lng, id }, user, customer }: PageProps) {
	return (
		<SiteWrapper>
			<div className='flex flex-col lg:flex-row items-stretch gap-4'>
				<Suspense fallback={<DetailsSkeleton />}>
					<ProductDetailsWrapper lng={lng} id={id} user={user} customer={customer} />
				</Suspense>
			</div>
			{hasPermissionByPlan(customer.plan, 'basis') && (
				<div className='flex flex-col lg:flex-row items-stretch gap-4 lg:h-96'>
					<Suspense fallback={<FilesSkeleton />}>
						<ProductFilesWrapper lng={lng} id={id} user={user} />
					</Suspense>
					<Suspense fallback={<FilesSkeleton />}>
						<ReorderWrapper lng={lng} id={id} user={user} />
					</Suspense>
				</div>
			)}
			<div>
				<Suspense fallback={<HistorySkeleton />}>
					<ProductInventoryWrapper lng={lng} id={id} user={user} customer={customer} />
				</Suspense>
			</div>
			<div>
				<Suspense fallback={<HistorySkeleton />}>
					<ProductHistoryWrapper customerID={user.customerID} lng={lng} id={id} />
				</Suspense>
			</div>
		</SiteWrapper>
	)
} 

export default withAuth(Page, undefined, 'læseadgang')
