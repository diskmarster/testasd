import { UpdateProductsForm } from '@/components/products/update-product-form'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { FormattedProduct } from '@/data/products.types'
import { Row, Table } from '@tanstack/react-table'
import { useState } from 'react'
import { TableActionsWrapper } from '../table/table-actions-wrapper'
import { toggleBarredProductAction } from '@/app/(site)/admin/produkter/actions'

interface Props {
  table: Table<FormattedProduct>
  row: Row<FormattedProduct>
}

export function TableOverviewActions({ table, row }: Props) {
  const [open, setOpen] = useState<boolean>(false)

  const handleToggleBar = async () => {
    const isCurrentlyBarred = row.original.isBarred;
    const updatedBarredStatus = !isCurrentlyBarred;
    const result = await toggleBarredProductAction(row.original.id, updatedBarredStatus);

    if (result.success) {
      console.log('Product bar status updated successfully');
    } else {
      console.error(result.serverError);
    }
  };

  const handleProductUpdated = () => {}

  // @ts-ignore
  const units = table.options.meta.units
  // @ts-ignore
  const groups = table.options.meta.groups

  return (
    <>
      <TableActionsWrapper>
        <DropdownMenuItem onClick={() => setOpen(true)}>
          Redigér produkt
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleBar}>
          {row.original.isBarred ? 'Ophæv spærring' : 'Spær'}
        </DropdownMenuItem>
      </TableActionsWrapper>

      <UpdateProductsForm
        units={units}
        groups={groups}
        productToEdit={row.original}
        onProductUpdated={handleProductUpdated}
        isOpen={open}
        setOpen={setOpen}
      />
    </>
  )
}
