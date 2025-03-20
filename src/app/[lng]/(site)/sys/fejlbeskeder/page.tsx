import { SiteWrapper } from '@/components/common/site-wrapper'
import { SkeletonTable } from '@/components/common/skeleton-table'
import { Suspense } from 'react'
import { ServerTable } from './table'
import { serverTranslation } from '@/app/i18n'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'

interface Props extends WithAuthProps {
  params: {
    lng: string
  }
}

async function Page({ params }: Props) {
  const { t } = await serverTranslation(params.lng, 'errors')

  return (
    <SiteWrapper title={t('page.title')} description={t('page.description')}>
      <Suspense fallback={<SkeletonTable />}>
        <ServerTable />
      </Suspense>
    </SiteWrapper>
  )
}

export default withAuth(Page, undefined, 'system_administrator')
