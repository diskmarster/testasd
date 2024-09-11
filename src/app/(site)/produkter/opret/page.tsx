import { SiteWrapper } from '@/components/common/site-wrapper'
import { FormCreateProducts } from '@/components/products/form-create-product'

export default async function Page() {
  return (
    <SiteWrapper
      title='Opret produkt'
      description='Her kan du oprette et produkt'>
      <div className='flex-auto justify-start'>
        <FormCreateProducts />
      </div>
    </SiteWrapper>
  )
}
