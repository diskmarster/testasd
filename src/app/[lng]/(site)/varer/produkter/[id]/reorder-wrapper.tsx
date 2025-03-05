import { ProductReorder } from "@/components/products/product-reorder";
import { tryParseInt } from "@/lib/utils";
import { inventoryService } from "@/service/inventory";
import { User } from "lucia";
import { redirect } from "next/navigation";

interface Props {
	id: string,
	lng: string
	user: User
}

export async function ReorderWrapper({ lng, id, user }: Props) {
	const productID = tryParseInt(id)
	if (!productID) {
		redirect(`/${lng}/oversigt`)
	}

	const reorder = await inventoryService.getReorderByIDs(productID, user.customerID, user.id)

	return (
		<ProductReorder user={user} reorder={reorder} />
	)
}
