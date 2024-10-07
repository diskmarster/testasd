'use client'

import { Location, LocationID } from '@/lib/database/schema/customer'
import { Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'

export function ButtonToggleUsers<TData>({
  table,
}: {
  table: Table<TData>
}) {
  const selectedRows = table.getSelectedRowModel().rows
  let selectedIDs: LocationID[] = []
  for (const { original } of selectedRows) {
    selectedIDs.push((original as Location).id)
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
