'use client'

import { UserID, UserNoHash } from '@/lib/database/schema/auth'
import { Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import { useLanguage } from '@/context/language'
import { useTranslation } from '@/app/i18n/client'

export function ButtonToggleUsers({ table }: { table: Table<UserNoHash> }) {
  const selectedRows = table.getSelectedRowModel().rows
  const selectedIDs: UserID[] = selectedRows.map(row => row.original.id)
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'common')

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
      }}
      tooltip={t('table-floating-bar.toggle-selected', {
        count: selectedIDs.length,
        domain: t('table-floating-bar.user', { count: selectedIDs.length }),
      })}>
      <Icons.listTodo className='size-5' />
    </Button>
  )
}
