'use client'

import { useTranslation } from '@/app/i18n/client'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/context/language'
import { FormattedReorder } from '@/data/inventory.types'
import { Row, Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { TableActionsWrapper } from '../table/table-actions-wrapper'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'

interface Props {
  table: Table<FormattedReorder>
  row: Row<FormattedReorder>
}

export function TableReorderActions({ table, row }: Props) {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'genbestil')

  return (
    <div className='flex items-center gap-2'>
      <Button
        size='iconSm'
        variant='ghost'
        onClick={() =>
          emitCustomEvent('AddOrderedReorderByIDs', {
            locationID: row.original.locationID,
            productID: row.original.productID,
            recommended: row.original.recommended,
            ordered: row.original.ordered,
          })
        }>
        <Icons.plus className='size-4' />
      </Button>
      <TableActionsWrapper>
        <DropdownMenuItem
          onClick={() => {
            emitCustomEvent('UpdateReorderByIDs', {
              locationID: row.original.locationID,
              productID: row.original.productID,
              customerID: row.original.customerID,
              minimum: row.original.minimum,
              buffer: row.original.buffer * 100,
            })
          }}>
          {t('table-reorder-actions.update')}
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            emitCustomEvent('DeleteReorderByIDs', {
              locationID: row.original.locationID,
              productID: row.original.productID,
            })
          }}>
          {t('table-reorder-actions.delete')}
        </DropdownMenuItem>
      </TableActionsWrapper>
    </div>
  )
}
