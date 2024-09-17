'use client'

import { Row, Table } from '@tanstack/react-table'
import { TableActionsWrapper } from '../table/table-actions-wrapper'
import { FormattedProduct } from '@/data/products.types'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'

interface Props {
  table: Table<FormattedProduct>
  row: Row<FormattedProduct>
}

export function TableOverviewActions({ table, row }: Props) {
  return (
    <TableActionsWrapper>
      <DropdownMenuItem>Redigér</DropdownMenuItem>
      <DropdownMenuItem>Fjern</DropdownMenuItem>
    </TableActionsWrapper>
  )
}
