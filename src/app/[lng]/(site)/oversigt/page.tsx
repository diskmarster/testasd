import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n/index'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalMoveInventory } from '@/components/inventory/modal-move-inventory'
import { ModalUpdateInventory } from '@/components/inventory/modal-update-inventory'
import { TableOverview } from '@/components/inventory/table-overview'
import { hasPermissionByPlan, hasPermissionByRank } from '@/data/user.types'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'

interface PageProps {
  params: {
    lng: string
  }
}

export default async function Home({ params: { lng } }: PageProps) {
  const { session, user } = await sessionService.validate()
  if (!session) return signOutAction()

  const { t } = await serverTranslation(lng, 'oversigt')

  const location = await locationService.getLastVisited(user.id!)
  if (!location) return null 

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
  const customerSettings = await customerService.getSettings(customer.id) ?? { usePlacement: true, useBatch: true, useReference: true }

  return (
    <SiteWrapper
      title={t('overview')}
      description={t('overview-description')}
      actions={
        <>
          {hasPermissionByRank(user.role, 'bruger') && (
            <ModalUpdateInventory
              customer={customer}
              products={products}
              placements={placements}
              batches={batches}
              lng={lng}
            />
          )}
          {hasPermissionByPlan(customer.plan, 'basis') &&
            customerSettings.usePlacement &&
            hasPermissionByRank(user.role, 'bruger') && (
              <ModalMoveInventory
                placements={placements}
                customer={customer}
                inventory={inventory}
                batches={batches}
                settings={customerSettings}
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
