import { serverTranslation } from '@/app/i18n/index'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { ModalMoveInventory } from '@/components/inventory/modal-move-inventory'
import { ModalUpdateInventory } from '@/components/inventory/modal-update-inventory'
import { TableOverview } from '@/components/inventory/table-overview'
import { FormattedInventory } from '@/data/inventory.types'
import { hasPermissionByPlan, hasPermissionByRank } from '@/data/user.types'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { InventoryTableRow } from './columns'
import { attachmentService } from '@/service/attachments'
import { Attachment } from '@/lib/database/schema/attachments'

interface PageProps extends WithAuthProps {
  params: {
    lng: string
  }
}

async function Home({ params: { lng }, user, customer }: PageProps) {
  const { t } = await serverTranslation(lng, 'oversigt')

  const location = await locationService.getLastVisited(user.id!)
  if (!location) return null

  let inventory = await inventoryService.getInventory(location)

  const units = await inventoryService.getActiveUnits()
  const groups = await inventoryService.getActiveGroupsByID(customer.id)
  const placements = await inventoryService.getActivePlacementsByID(location)
  const batches = await inventoryService.getActiveBatchesByID(location)
  const products = await inventoryService.getActiveProductsByID(customer.id)
  const customerSettings = (await customerService.getSettings(customer.id)) ?? {
    usePlacement: true,
    useBatch: true,
    useReference: {
      tilgang: true,
      afgang: true,
      regulering: true,
      flyt: true,
    },
  }

  const isGrouped =
    (hasPermissionByPlan(customer.plan, 'basis') &&
      customerSettings.usePlacement) ||
    (hasPermissionByPlan(customer.plan, 'pro') && customerSettings.useBatch)

	inventory = Object.values(
		inventory.reduce(
			(acc, cur) => {
				if (acc[cur.product.id] == undefined) {
					acc[cur.product.id] = []
				}

				acc[cur.product.id].push(cur)

				return acc
			},
			{} as Record<number, FormattedInventory[]>,
		),
	).flatMap(invs =>
		invs.every(inv => inv.quantity == 0)
			? invs
			: invs.filter(inv => inv.quantity != 0),
	)

  const inventoryMap: Map<string, FormattedInventory> = inventory.reduce(
    (acc, cur) => {
      const keyParts = [String(cur.product.id)]
      if (
        hasPermissionByPlan(customer.plan, 'basis') &&
        customerSettings.usePlacement
      )
        keyParts.push(String(cur.placement.id))
      if (
        hasPermissionByPlan(customer.plan, 'pro') &&
        customerSettings.useBatch
      )
        keyParts.push(String(cur.batch.id))

      const key = keyParts.join('|')

      if (acc.has(key)) {
        const current = acc.get(key)!
        current.quantity += cur.quantity
        acc.set(key, current)
      } else {
        acc.set(key, cur)
      }

      return acc
    },
    new Map<string, FormattedInventory>(),
  )

  inventory = Array.from(inventoryMap.values()).sort((a, b) => {
    const skuCompare = a.product.sku.localeCompare(b.product.sku)

    if (skuCompare == 0) {
      return b.placement.name.localeCompare(a.placement.name)
    } else {
      return skuCompare
    }
  })

  const reorders = await inventoryService.getReordersByID(location, {
    withRequested: false,
  })

  const images = await attachmentService.getByCustomerID(customer.id, 'product', 'image')
  const imageMap: Map<string, Attachment[]> = images.reduce((acc: Map<string, Attachment[]>, cur) => {
	  if (!acc.has(cur.refID))	 {
		  acc.set(cur.refID, [cur])
	  }

	  const atts = acc.get(cur.refID)
	  acc.set(cur.refID, [...atts!, cur])

	  return acc
  }, new Map())

  const rows: InventoryTableRow[] = inventory.map(i => ({
    ...i,
    disposable:
      reorders.find(r => r.productID === i.product.id)?.disposible ?? null,
	images: imageMap.get(i.product.id.toString(10)) ?? []
  }))

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
              settings={customerSettings}
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
        data={rows}
        user={user}
        plan={customer.plan}
        units={units}
        groups={groups}
        placements={placements}
        batches={batches}
        customerSettings={customerSettings}
        isGrouped={isGrouped}
      />
    </SiteWrapper>
  )
}

export default withAuth(Home)
