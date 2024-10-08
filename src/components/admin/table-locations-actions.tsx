'use client'

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Location } from '@/lib/database/schema/customer'
import { Row, Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
  table: Table<Location>
  row: Row<Location>
}

export function TableLocationsActions({ table, row }: Props) {
  return (
    <TableActionsWrapper>
      <DropdownMenuItem
        onClick={() => {
          emitCustomEvent('EditLocationByID', {
            locationID: row.original.id,
            name: row.original.name,
          })
        }}>
        Rediger
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => {
          emitCustomEvent('ToggleLocationByID', {
            locationIDs: [row.original.id],
            status: row.original.isBarred,
          })
        }}>
        Skift status
      </DropdownMenuItem>
    </TableActionsWrapper>
  )
}
