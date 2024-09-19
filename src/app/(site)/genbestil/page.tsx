import { signOutAction } from '@/app/(auth)/log-ud/actions'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalCreateReorder } from '@/components/inventory/modal-create-reorder'
import { TableReorder } from '@/components/inventory/table-reorder'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'

export default async function Page() {
  const { session, user } = await sessionService.validate()
  if (!session) return signOutAction()

  const location = await locationService.getLastVisited(user.id!)
  if (!location) return signOutAction()

  const customer = await customerService.getByID(user.customerID)
  if (!customer) return signOutAction()

  const products = await inventoryService.getProductsByID(customer.id)
  const reorders = await inventoryService.getReordersByID(location)
  const units = await inventoryService.getUnits()
  const groups = await inventoryService.getGroupsByID(customer.id)

  return (
    <SiteWrapper
      title='Genbestil'
      description='Få et overblik over hvilke vare der er under en minimums beholdning'
      actions={
        <>
          <ModalCreateReorder products={products} locationID={location} />
        </>
      }>
      <TableReorder data={reorders} user={user} units={units} groups={groups} />
    </SiteWrapper>
  )
}
