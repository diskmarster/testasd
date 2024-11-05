import { serverTranslation } from '@/app/i18n'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalCreateBatch } from '@/components/inventory/modal-create-batch'
import { TableBatch } from '@/components/inventory/table-batchnumber'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

interface PageProps {
  params: {
    lng: string
  }
}

export default async function Page({ params: { lng } }: PageProps) {
  const { session, user } = await sessionService.validate()
  if (!session) redirect('/log-ind')

  const location = await locationService.getLastVisited(user.id!)
  if (!location) redirect('/log-ind')

  const customer = await customerService.getByID(user.customerID)
  if (!customer) redirect('/log-ind')

  const allBatches = await inventoryService.getAllBatchesByID(location)
  const { t } = await serverTranslation(lng, 'batch')
  console.log(lng)
  return (
    <SiteWrapper
      title={t('batch-page.page-title')}
      description={t('batch-page.page-description')}
      actions={
        <>
          <ModalCreateBatch />
        </>
      }>
      <TableBatch data={allBatches} user={user} />
    </SiteWrapper>
  )
}
