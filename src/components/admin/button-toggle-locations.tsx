'use client'

import { Location, LocationID } from '@/lib/database/schema/customer'
import { Row, Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import { LocationWithCounts } from '@/data/location.types'

export function ButtonToggleLocations({ table }: { table: Table<LocationWithCounts> }) {
  const selectedRows: Row<LocationWithCounts>[] = table.getSelectedRowModel().rows
  const selectedIDs: LocationID[] = selectedRows.map(row => row.original.id)

  return (
    <Button
      size='icon'
      variant='outline'
      className='bg-popover'
      onClick={() => {
        emitCustomEvent('ToggleLocationByID', {
          locationIDs: selectedIDs,
        })
        table.resetRowSelection()
      }}>
      <Icons.lisTodo className='size-5' />
    </Button>
  )
}
