import { signOutAction } from '@/app/(auth)/log-ud/actions'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { ModalImportProducts } from '@/components/inventory/modal-import-products'
import { CreateProductsForm } from '@/components/products/create-product-form'
import { ProductOverview } from '@/components/products/table-overview'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { productService } from '@/service/products'
import { sessionService } from '@/service/session'

export default async function Page() {
  const { session, user } = await sessionService.validate()
  if (!session) {
    return signOutAction()
  }

  const customer = await customerService.getByID(user.customerID)
  if (!customer) {
    return signOutAction()
  }
  const units = await inventoryService.getActiveUnits()
  const groups = await inventoryService.getActiveGroupsByID(user.customerID)
  const products = await productService.getAllByCustomerID(user.customerID)

  return (
    <SiteWrapper
      title='Opret produkt'
      description='Her kan du oprette et produkt'
      actions={
        <>
          <ModalImportProducts />
          <CreateProductsForm units={units} groups={groups} />
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
