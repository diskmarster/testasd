import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { SkeletonTable } from '@/components/common/skeleton-table'
import { hasPermissionByRank } from '@/data/user.types'
import { customerService } from '@/service/customer'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { ServerTable } from './table'
import { serverTranslation } from '@/app/i18n'

interface Props {
  params: {
    lng: string
  }
}

export default async function Page({ params }: Props) {
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

  const { t } = await serverTranslation(params.lng, 'errors')

  return (
    <SiteWrapper title={t('page.title')} description={t('page.description')}>
      <Suspense fallback={<SkeletonTable />}>
        <ServerTable />
      </Suspense>
    </SiteWrapper>
  )
}
