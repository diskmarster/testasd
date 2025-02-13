import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalImportProducts } from '@/components/inventory/modal-import-products'
import { CreateProductsForm } from '@/components/products/create-product-form'
import { ProductOverview } from '@/components/products/table-overview'
import { hasPermissionByRank } from '@/data/user.types'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { productService } from '@/service/products'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

interface PageProps {
  params: {
    lng: string
  }
}
export const maxDuration = 60

export default async function Page({ params: { lng } }: PageProps) {
  const { session, user } = await sessionService.validate()
  if (!session) {
    signOutAction()
    return
  }

  if (!hasPermissionByRank(user.role, 'læseadgang')) {
    redirect('/oversigt')
  }

  const { t } = await serverTranslation(lng, 'produkter')

  const customer = await customerService.getByID(user.customerID)
  if (!customer) {
    signOutAction()
    return
  }
  const units = await inventoryService.getActiveUnits()
  const groups = await inventoryService.getActiveGroupsByID(user.customerID)
  const products = await productService.getAllByCustomerID(user.customerID)

  return (
    <SiteWrapper
      title={t('product-title')}
      description={t('product-description')}
      actions={
        <>
          {hasPermissionByRank(user.role, 'bruger') && <ModalImportProducts />}

          {hasPermissionByRank(user.role, 'bruger') && (
            <CreateProductsForm units={units} groups={groups} />
          )}
        </>
      }>
      <ProductOverview
        data={products}
        user={user}
        plan={customer.plan}
        units={units}
        groups={groups}
      />
    </SiteWrapper>
  )
}
