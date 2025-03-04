'use client'

import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { LocationWithCounts } from '@/data/location.types'
import { LocationID } from '@/lib/database/schema/customer'
import { Row, Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'

export function ButtonToggleLocations({
  table,
}: {
  table: Table<LocationWithCounts>
}) {
  const selectedRows: Row<LocationWithCounts>[] =
    table.getSelectedRowModel().rows
  const selectedIDs: LocationID[] = selectedRows.map(row => row.original.id)
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'common')

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
      }}
      tooltip={t('table-floating-bar.toggle-selected', {
        count: selectedIDs.length,
        domain: t('table-floating-bar.location', { count: selectedIDs.length }),
      })}>
      <Icons.listTodo className='size-5' />
    </Button>
  )
}
