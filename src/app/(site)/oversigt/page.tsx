import { signOutAction } from '@/app/(auth)/log-ud/actions'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalImportInventory } from '@/components/inventory/modal-import-inventory'
import { ModalMoveInventory } from '@/components/inventory/modal-move-inventory'
import { ModalUpdateInventory } from '@/components/inventory/modal-update-inventory'
import { TableOverview } from '@/components/inventory/table-overview'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'

export default async function Home() {
  const { session, user } = await sessionService.validate()
  if (!session) return signOutAction()

  const location = await locationService.getLastVisited(user.id!)
  if (!location) return null // TODO: make some error page

  const customer = await customerService.getByID(user.customerID)
  if (!customer) return signOutAction()

  const inventory = await inventoryService.getInventory(location)
  inventory.sort((a, b) => {
    const skuCompare = a.product.sku.localeCompare(b.product.sku)

    if (skuCompare == 0) {
      return b.placement.name.localeCompare(a.placement.name)
    } else {
      return skuCompare
    }
  })
  const units = await inventoryService.getActiveUnits()
  const groups = await inventoryService.getActiveGroupsByID(customer.id)
  const placements = await inventoryService.getActivePlacementsByID(location)
  const batches = await inventoryService.getActiveBatchesByID(location)
  const products = await inventoryService.getActiveProductsByID(customer.id)

  return (
    <SiteWrapper
      title='Oversigt'
      description='Se en oversigt over din vare beholdning'
      actions={
        <>
          <ModalImportInventory />
          <ModalUpdateInventory
            customer={customer}
            products={products}
            placements={placements}
            batches={batches}
          />
          {customer.plan != 'lite' && (
            <ModalMoveInventory
              placements={placements}
              customer={customer}
              inventory={inventory}
              batches={batches}
            />
          )}
        </>
      }>
      <TableOverview
        data={inventory}
        user={user}
        plan={customer.plan}
        units={units}
        groups={groups}
        placements={placements}
        batches={batches}
      />
    </SiteWrapper>
  )
}
