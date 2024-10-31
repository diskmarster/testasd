import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { SkeletonTable } from '@/components/common/skeleton-table'
import { TableErrors } from '@/components/errors/table-errors'
import { Skeleton } from '@/components/ui/skeleton'
import { hasPermissionByRank } from '@/data/user.types'
import { customerService } from '@/service/customer'
import { errorsService } from '@/service/errors'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { ServerTable } from './table'

export default async function Page() {
  const { session, user } = await sessionService.validate()
  if (!session) redirect('/login')

  if (!hasPermissionByRank(user.role, 'system_administrator')) {
    redirect("/oversigt")
  }
  const location = await locationService.getLastVisited(user.id!)
  if (!location) {
    signOutAction()
    return
  }
  const customer = await customerService.getByID(user.customerID)
  if (!customer) {
    signOutAction()
    return
  }


  return (
    <SiteWrapper title='Fejlbeskeder' description='Få et overblik over alle fejlbeskeder på NemLager'>
      <Suspense fallback={<SkeletonTable />}>
        <ServerTable />
      </Suspense>
    </SiteWrapper>
  )
}
