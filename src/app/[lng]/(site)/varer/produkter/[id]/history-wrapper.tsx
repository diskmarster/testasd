import { ProductHistory } from "@/components/products/product-history";
import { productService } from "@/service/products";

interface Props {
	lng: string
	id: string
	customerID: number
}

export async function ProductHistoryWrapper({ id, lng, customerID }: Props) {
	const history = await productService.getHistoryLogs(customerID, parseInt(id))
	return (
		<ProductHistory history={history} />
	)
}
