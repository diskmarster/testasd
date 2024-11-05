import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalAddOrderedReorder } from '@/components/inventory/modal-add-ordered-modal'
import { ModalCreateReorder } from '@/components/inventory/modal-create-reorder'
import { ModalDeleteReorder } from '@/components/inventory/modal-delete-reorder'
import { ModalUpdateReorder } from '@/components/inventory/modal-update-reorder'
import { TableReorder } from '@/components/inventory/table-reorder'
import { hasPermissionByRank } from '@/data/user.types'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

interface PageProps {
  params: {
    lng: string
  }
}
export default async function Page( { params: { lng } }: PageProps ) {
  const { t } = await serverTranslation(lng, 'genbestil')
  const { session, user } = await sessionService.validate()
  if (!session) {
    signOutAction()
    return
  }

  if (!hasPermissionByRank(user.role, 'bruger')) {
    redirect("/oversigt")
  }

  const location = await locationService.getLastVisited(user.id!)
  if (!location) {
    signOutAction()
    return
  }

  const customer = await customerService.getByID(user.customerID)
  if (!customer) {
    signOutAction()
    return
  }

  const products = await inventoryService.getActiveProductsByID(customer.id)
  const reorders = await inventoryService.getReordersByID(location)
  const units = await inventoryService.getActiveUnits()
  const groups = await inventoryService.getActiveGroupsByID(customer.id)

  const productsWithNoReorder = products.filter(
    prod => !reorders.some(reorder => prod.id === reorder.productID),
  )

  return (
    <SiteWrapper
      title={t('reorder-page.title')}
      description={t('reorder-page.description')}
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
