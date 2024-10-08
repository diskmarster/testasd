'use client'

import { Location, LocationID } from '@/lib/database/schema/customer'
import { Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import { UserNoHash } from '@/lib/database/schema/auth'

export function ButtonToggleUsers<TData>({
  table,
}: {
  table: Table<TData>
}) {
  const selectedRows = table.getSelectedRowModel().rows
  let selectedIDs: LocationID[] = []
  for (const { original } of selectedRows) {
    selectedIDs.push((original as UserNoHash).id.toString())
  }

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
