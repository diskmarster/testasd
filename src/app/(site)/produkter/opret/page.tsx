import { SiteWrapper } from '@/components/common/site-wrapper'
import { FormCreateProducts } from '@/components/products/form-create-product'
import { inventoryService } from '@/service/inventory'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

export default async function Page() {
  const {session, user} = await sessionService.validate()
  if (
    !session
  ) redirect("/log-ind")

  const units = await inventoryService.getUnits()
  const groups = await inventoryService.getGroupsByID(user.customerID)

  return (
    <SiteWrapper
      title='Opret produkt'
      description='Her kan du oprette et produkt'>
      <div className='flex-auto justify-start'>
        <FormCreateProducts units={units} groups={groups} />
      </div>
    </SiteWrapper>
  )
}
