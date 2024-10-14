import { serverTranslation } from '@/app/i18n'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalCreateProductGroup } from '@/components/inventory/modal-create-group'
import { TableProductGroups } from '@/components/inventory/table-product-groups'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

interface PageProps {
  params: {
    lng: string
  }
}

export default async function Page({ params: { lng } }: PageProps) {
  const { session, user } = await sessionService.validate()
  if (!session) redirect(`/${lng}/log-ind`)

  const customer = await customerService.getByID(user.customerID)
  if (!customer) redirect(`/${lng}/log-ind`)

  // Fetch all product groups for the customer
  const groups = await inventoryService.getAllGroupsByID(customer.id)

  const { t } = await serverTranslation(lng, 'varegrupper')

  return (
    <SiteWrapper
      title={t('product-group-page.title')}
      description={t('product-group-page.description')}
      actions={
        <>
          <ModalCreateProductGroup />
        </>
      }>
      <TableProductGroups groups={groups} user={user} />
    </SiteWrapper>
  )
}
