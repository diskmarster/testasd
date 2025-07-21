import { serverTranslation } from '@/app/i18n'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { ModalCreateBatch } from '@/components/inventory/modal-create-batch'
import { ModalUpdateBatch } from '@/components/inventory/modal-update-batch'
import { TableBatch } from '@/components/inventory/table-batchnumber'
import { hasPermissionByRank } from '@/data/user.types'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { redirect } from 'next/navigation'

interface PageProps extends WithAuthProps {
  params: {
    lng: string
  }
}

async function Page({ params: { lng }, user, pathname }: PageProps) {
  const location = await locationService.getLastVisited(user.id)
  if (!location) redirect(`/${lng}/log-ind?redirect=${pathname}`)

  const allBatches = await inventoryService.getAllBatchesByID(location)
  const { t } = await serverTranslation(lng, 'batch')
  return (
    <SiteWrapper
      title={t('batch-page.page-title')}
      description={t('batch-page.page-description')}
      actions={
        <>{hasPermissionByRank(user.role, 'bruger') && <ModalCreateBatch />}</>
      }>
      <TableBatch data={allBatches} user={user} />
      <ModalUpdateBatch />
    </SiteWrapper>
  )
}

export default withAuth(Page)
