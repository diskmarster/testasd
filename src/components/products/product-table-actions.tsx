import { toggleBarredProductAction } from '@/app/[lng]/(site)/admin/produkter/actions'
import { UpdateProductsForm } from '@/components/products/update-product-form'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { siteConfig } from '@/config/site'
import { FormattedProduct } from '@/data/products.types'
import { Row, Table } from '@tanstack/react-table'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
  table: Table<FormattedProduct>
  row: Row<FormattedProduct>
}

export function TableOverviewActions({ table, row }: Props) {
  const [open, setOpen] = useState<boolean>(false)
  const [_, startTransition] = useTransition()

  const handleToggleBar = () => {
    startTransition(async () => {
      const isCurrentlyBarred = row.original.isBarred
      const updatedBarredStatus = !isCurrentlyBarred
      const res = await toggleBarredProductAction({
        productID: row.original.id,
        isBarred: updatedBarredStatus,
      })

      if (res && res.serverError) {
        toast.error(siteConfig.errorTitle, {
          description: res.serverError,
        })
        return
      }

      toast.success(siteConfig.successTitle, {
        description: 'Produkt opdateret successfuldt',
      })
    })
  }

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
        isOpen={open}
        setOpen={setOpen}
      />
    </>
  )
}
