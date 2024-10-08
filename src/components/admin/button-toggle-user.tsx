'use client'

import { UserID, UserNoHash } from '@/lib/database/schema/auth'
import { Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'

export function ButtonToggleUsers({ table }: { table: Table<UserNoHash> }) {
  const selectedRows = table.getSelectedRowModel().rows
  const selectedIDs: UserID[] = selectedRows.map(row => row.original.id)

  return (
    <Button
      size='icon'
      variant='outline'
      className='bg-popover'
      onClick={() => {
        emitCustomEvent('ToggleUserByID', {
          userIDs: selectedIDs,
        })
        table.resetRowSelection()
      }}>
      <Icons.lisTodo className='size-5' />
    </Button>
  )
}
