import { TableOverview } from '@/components/inventory/table-overview'
import { FormattedInventory, FormattedReorder } from '@/data/inventory.types'
import { Attachment } from '@/lib/database/schema/attachments'
import { Customer, CustomerSettings } from '@/lib/database/schema/customer'
import { Batch, Group, Placement, Unit } from '@/lib/database/schema/inventory'
import { User } from 'lucia'
import { InventoryTableRow } from './columns'

interface Props {
	user: User
	customer: Customer
	units: Promise<Unit[]>
	groups: Promise<Group[]>
	placements: Promise<Placement[]>
	batches: Promise<Batch[]>
	customerSettings: Pick<CustomerSettings, 'useReference' | 'usePlacement'>
	reordersPromise: Promise<FormattedReorder[]>
	imagesPromise: Promise<Attachment[]>
	inventoryPromise: Promise<FormattedInventory[]>
	isGrouped: boolean
}

export async function OverviewTableWrapper({
	user,
	customer,
	units,
	groups,
	placements,
	batches,
	customerSettings,
	reordersPromise,
	imagesPromise,
	inventoryPromise,
	isGrouped,
}: Props) {
	const reorders = await reordersPromise
	const images = await imagesPromise
	const inventory = await inventoryPromise

	const imageMap: Map<string, Attachment[]> = images.reduce(
		(acc: Map<string, Attachment[]>, cur) => {
			if (!acc.has(cur.refID)) {
				acc.set(cur.refID, [cur])
			}

			const atts = acc.get(cur.refID)
			acc.set(cur.refID, [...atts!, cur])

			return acc
		},
		new Map(),
	)

	const rows: InventoryTableRow[] = inventory.map(i => ({
		...i,
		productHasDefaultPlacement: inventory
			.filter(inv => inv.product.id == i.product.id)
			.some(inv => inv.isDefaultPlacement),
		disposable:
			reorders.find(r => r.productID === i.product.id)?.disposible ?? null,
		images: imageMap.get(i.product.id.toString(10)) ?? [],
	}))

	return (
		<TableOverview
			data={rows}
			user={user}
			plan={customer.plan}
			units={await units}
			groups={await groups}
			placements={await placements}
			batches={await batches}
			customerSettings={customerSettings}
			isGrouped={isGrouped}
		/>
	)
}
