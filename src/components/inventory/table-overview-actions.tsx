'use client'

import { useTranslation } from '@/app/i18n/client'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/context/language'
import { Plan } from '@/data/customer.types'
import { FormattedInventory } from '@/data/inventory.types'
import { Row, Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
  table: Table<FormattedInventory>
  row: Row<FormattedInventory>
  plan: Plan
}

export function TableOverviewActions({ table, row, plan }: Props) {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'oversigt')

  return (
    <TableActionsWrapper>
      <DropdownMenuItem
        onClick={() => {
          emitCustomEvent('UpdateInventoryByIDs', {
            productName: row.original.product.text1,
            productID: row.original.product.id,
            placementID: row.original.placement.id,
            placementName: row.original.placement.name,
            batchID: row.original.batch.id,
            batchName: row.original.batch.batch,
          })
        }}>
        {t('update-inventory')}
      </DropdownMenuItem>
      {plan != 'lite' && (
        <DropdownMenuItem
          onClick={() => {
            emitCustomEvent('MoveInventoryByIDs', {
              productName: row.original.product.text1,
              productID: row.original.product.id,
              placementID: row.original.placement.id,
              placementName: row.original.placement.name,
              batchID: row.original.batch.id,
              batchName: row.original.batch.batch,
            })
          }}>
          {t('move-inventory')}{' '}
        </DropdownMenuItem>
      )}
    </TableActionsWrapper>
  )
}
