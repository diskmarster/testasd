import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalCreatePlacement } from '@/components/inventory/modal-create-placement'
import { TablePlacement } from '@/components/inventory/table-placements'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

export default async function Page() {
  const { session, user } = await sessionService.validate()
  if (!session) redirect('/log-ind')

  const location = await locationService.getLastVisited(user.id!)
  if (!location) redirect('/log-ind')

  const history = await inventoryService.getHistoryByLocationID(location)
  const customer = await customerService.getByID(user.customerID)
  if (!customer) redirect('/log-ind')

  const units = await inventoryService.getUnits()
  const groups = await inventoryService.getGroupsByID(customer.id)
  const placements = await inventoryService.getPlacementsByID(location)
  const allPlacement = await inventoryService.getAllPlacementsByID(location)
  const batches = await inventoryService.getBatchesByID(location)
  const products = await inventoryService.getProductsByID(customer.id)

  return (
    <SiteWrapper
      title='Placeringer'
      description='Se en oversigt over alle dine placeringer'
      actions={
        <>
          <ModalCreatePlacement />
        </>
      }>
      <TablePlacement data={allPlacement} user={user} />
    </SiteWrapper>
  )
}
