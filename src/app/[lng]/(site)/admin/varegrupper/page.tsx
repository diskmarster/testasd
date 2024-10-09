import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalCreateProductGroup } from '@/components/inventory/modal-create-group'
import { TableProductGroups } from '@/components/inventory/table-product-groups'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

export default async function Page() {
  const { session, user } = await sessionService.validate()
  if (!session) redirect('/log-ind')

  const customer = await customerService.getByID(user.customerID)
  if (!customer) redirect('/log-ind')

  // Fetch all product groups for the customer
  const groups = await inventoryService.getAllGroupsByID(customer.id)

  return (
    <SiteWrapper
      title='Varegrupper'
      description='Se en oversigt over alle dine varegrupper'
      actions={
        <>
          <ModalCreateProductGroup />
        </>
      }>
      <TableProductGroups groups={groups} user={user} />
    </SiteWrapper>
  )
}
