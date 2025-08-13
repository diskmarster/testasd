import { ProductDetails } from '@/components/products/product-details'
import { Customer } from '@/lib/database/schema/customer'
import { tryParseInt } from '@/lib/utils'
import { integrationsService } from '@/service/integrations'
import { productService } from '@/service/products'
import { User } from 'lucia'
import { redirect } from 'next/navigation'

interface Props {
	id: string
	lng: string
	user: User
	customer: Customer
}

export async function ProductDetailsWrapper({
	lng,
	id,
	user,
	customer,
}: Props) {
	const productID = tryParseInt(id)
	if (!productID) {
		redirect(`/${lng}/oversigt`)
	}

	const product = await productService.getByID(productID, lng)
	const integrationSettings = await integrationsService.getSettings(
		user.customerID,
	)

	if (!product) {
		redirect(`/${lng}/oversigt`)
	}

	return (
		<ProductDetails
			integrationSettings={integrationSettings}
			product={product}
			user={user}
			customer={customer}
		/>
	)
}
