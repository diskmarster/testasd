import { SiteWrapper } from '@/components/common/site-wrapper'
import { CreateProductsForm } from '@/components/products/create-product-form'
import { ProductOverview } from '@/components/products/table-overview'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'
import { productService } from '@/service/products'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

export default async function Page() {
  const { session, user } = await sessionService.validate()
  if (!session) redirect('/log-ind')

  const customer = await customerService.getByID(user.customerID)
  if (!customer) return null

  const units = await inventoryService.getUnits()
  const groups = await inventoryService.getGroupsByID(user.customerID)
  const products = await productService.getAllByID(user.customerID)

  return (
    <SiteWrapper
      title='Opret produkt'
      description='Her kan du oprette et produkt'
      actions={
        <>
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
