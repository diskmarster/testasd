import { Table } from '@tanstack/react-table'
import { ModalProductLabelTrigger } from '../inventory/modal-product-label'
import { FormattedProduct } from '@/data/products.types'

export function PrintSelectedButton({
	table,
}: {
	table: Table<FormattedProduct>
}) {
	const selectedRows = table.getSelectedRowModel().rows
	const labelData = selectedRows.map(r => ({
		text1: r.original.text1,
		text2: r.original.text2,
		sku: r.original.sku,
		barcode: r.original.barcode,
	}))
	return (
		<ModalProductLabelTrigger
			className='size-9'
			variant="outline"
			labelData={labelData}
		/>
	)
}

