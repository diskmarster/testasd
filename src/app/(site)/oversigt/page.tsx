import { signOutAction } from '@/app/(auth)/log-ud/actions'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalInventoryIncoming } from '@/components/inventory/modal-inventory-incoming'
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
  if (!customer) return null

  const inventory = await inventoryService.getInventory(location)
  const units = await inventoryService.getUnits()
  const groups = await inventoryService.getGroupsByID(customer.id)
  const placements = await inventoryService.getPlacementsByID(location)
  const batches = await inventoryService.getBatchesByID(location)

  return (
    <SiteWrapper
      title='Oversigt'
      description='Se en oversigt over din vare beholdning'
      actions={
        <>
          <ModalInventoryIncoming customer={customer} inventory={inventory} />
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
