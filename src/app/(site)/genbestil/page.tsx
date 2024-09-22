import { signOutAction } from '@/app/(auth)/log-ud/actions'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalAddOrderedReorder } from '@/components/inventory/modal-add-ordered-modal'
import { ModalCreateReorder } from '@/components/inventory/modal-create-reorder'
import { ModalDeleteReorder } from '@/components/inventory/modal-delete-reorder'
import { ModalUpdateReorder } from '@/components/inventory/modal-update-reorder'
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

  const productsWithNoReorder = products.filter(
    prod => !reorders.some(reorder => prod.id === reorder.productID),
  )

  return (
    <SiteWrapper
      title='Genbestil'
      description='Få et overblik over hvilke vare der er under en minimums beholdning'
      actions={
        <>
          <ModalCreateReorder
            products={productsWithNoReorder}
            locationID={location}
          />
        </>
      }>
      <TableReorder data={reorders} user={user} units={units} groups={groups} />

      {/* Modals without triggers that we open with custom events from row actions */}
      <ModalUpdateReorder products={products} />
      <ModalDeleteReorder products={products} />
      <ModalAddOrderedReorder products={products} />
    </SiteWrapper>
  )
}
