'use client'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { FormattedInventory } from '@/data/inventory.types'
import { Row, Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
  table: Table<FormattedInventory>
  row: Row<FormattedInventory>
}

export function TableOverviewActions({ table, row }: Props) {
  return (
    <TableActionsWrapper>
      <DropdownMenuItem
        onClick={() => {
          emitCustomEvent('UpdateInventoryByIDs', {
            productID: row.original.product.id,
            placementID: row.original.placement.id,
            batchID: row.original.batch.id,
          })
        }}>
        Opdater beholdning
      </DropdownMenuItem>
      <DropdownMenuItem
        onClick={() => {
          emitCustomEvent('MoveInventoryByIDs', {
            productID: row.original.product.id,
            placementID: row.original.placement.id,
            batchID: row.original.batch.id,
          })
        }}>
        Flyt beholdning
      </DropdownMenuItem>
    </TableActionsWrapper>
  )
}
