'use client'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { FormattedInventory } from '@/data/inventory.types'
import { Row, Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { TableActionsWrapper } from '../table/table-actions-wrapper'
import { Plan } from '@/data/customer.types'

interface Props {
  table: Table<FormattedInventory>
  row: Row<FormattedInventory>
  plan: Plan
}

export function TableOverviewActions({ table, row, plan }: Props) {
  return (
    <TableActionsWrapper>
      <DropdownMenuItem
        onClick={() => {
          emitCustomEvent('UpdateInventoryByIDs', {
            productName: row.original.product.text1,
            productID: row.original.product.id,
            placementID: row.original.placement.id,
            placementName: row.original.placement.name,
            batchID: row.original.batch.id,
            batchName: row.original.batch.batch
          })
        }}>
        Opdater beholdning
      </DropdownMenuItem>
      {plan != 'lite' && (
        <DropdownMenuItem
          onClick={() => {
            emitCustomEvent('MoveInventoryByIDs', {
              productName: row.original.product.text1,
              productID: row.original.product.id,
              placementID: row.original.placement.id,
              placementName: row.original.placement.name,
              batchID: row.original.batch.id,
              batchName: row.original.batch.batch
            })
          }}>
          Flyt beholdning
        </DropdownMenuItem>
      )}
    </TableActionsWrapper>
  )
}
