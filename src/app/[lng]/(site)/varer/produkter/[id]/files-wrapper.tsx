import { ProductFilesGrid } from "@/components/products/product-files-grid"
import { User } from "@/lib/database/schema/auth"
import { attachmentService } from "@/service/attachments"

interface Props {
	id: string
	lng: string
	user: User
}

export async function ProductFilesWrapper({ id, lng, user }: Props) {
	const files = await attachmentService.getByRefID('product', id)
	return (
		<ProductFilesGrid files={files} user={user} productID={Number(id)} />
	)
}
