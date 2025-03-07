'use client'

import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { Table } from '@tanstack/react-table'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import { emitCustomEvent } from 'react-custom-events'
import { useMemo } from 'react'
import { FormattedReorder } from '@/data/inventory.types'

export function ReorderSelectedButton({
  table,
}: {
  table: Table<FormattedReorder>
}) {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'genbestil')
  const selectedRowModel = table.getFilteredSelectedRowModel()

  const reorders: FormattedReorder[] = useMemo(() => {
    return selectedRowModel
      .rows
      .map(row => row.original)
  }, [selectedRowModel])

  return (
    <Button
      variant='outline'
      size='icon'
      tooltip={t('bulk.tooltipWithCount', {count: reorders.length})}
      onClick={() => {
        emitCustomEvent('BulkReorder', { reorders })
      }}>
      <Icons.listPlus className='size-4' />
    </Button>
  )
}
