import { ProductDetails } from "@/components/products/product-details";
import { tryParseInt } from "@/lib/utils";
import { productService } from "@/service/products";
import { User } from "lucia";
import { redirect } from "next/navigation";

interface Props {
	id: string,
	lng: string
	user: User
}

export async function ProductDetailsWrapper({ lng, id, user }: Props) {
	const productID = tryParseInt(id)
	if (!productID) {
		redirect(`/${lng}/oversigt`)
	}

	const product = await productService.getByID(productID, lng)

	if (!product) {
		redirect(`/${lng}/oversigt`)
	}

	return (
		<ProductDetails product={product} user={user} />
	)
}
