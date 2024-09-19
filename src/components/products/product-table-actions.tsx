import { UpdateProductsForm } from '@/components/products/update-product-form'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { FormattedProduct } from '@/data/products.types'
import { Row, Table } from '@tanstack/react-table'
import { TableActionsWrapper } from '../table/table-actions-wrapper'
import { useState } from 'react'

interface Props {
  table: Table<FormattedProduct>
  row: Row<FormattedProduct>
}

export function TableOverviewActions({ table, row }: Props) {
  const [open, setOpen] = useState<boolean>(false)
  
  const handleProductUpdated = () => {
  }

  // @ts-ignore
  const units = table.options.meta.units
  // @ts-ignore
  const groups = table.options.meta.groups

  return (
    <>
      <TableActionsWrapper>
        <DropdownMenuItem onClick={() => setOpen(true)} >
          Redigér produkt
        </DropdownMenuItem>
        <DropdownMenuItem>Spær</DropdownMenuItem>
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
