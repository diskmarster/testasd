'use client'

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { UserNoHash } from '@/lib/database/schema/auth'
import { Row, Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
  table: Table<UserNoHash>
  row: Row<UserNoHash>
}

export function TableUsersActions({ table, row }: Props) {
  return (
    <TableActionsWrapper>
      <DropdownMenuItem
        onClick={() => {
          emitCustomEvent('ToggleUserByID', {
            userIDs: [row.original.id],
          })
        }}>
        Skift status
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        disabled
        onClick={() => {
          emitCustomEvent('DeleteReorderByIDs', {
            foo: 'foo',
          })
        }}>
        Nulstil kodeord
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled
        onClick={() => {
          emitCustomEvent('DeleteReorderByIDs', {
            foo: 'foo',
          })
        }}>
        Nulstil PIN
      </DropdownMenuItem>
    </TableActionsWrapper>
  )
}
