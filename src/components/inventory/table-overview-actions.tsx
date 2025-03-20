'use client'

import { useTranslation } from '@/app/i18n/client'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/context/language'
import { Plan } from '@/data/customer.types'
import { FormattedInventory } from '@/data/inventory.types'
import { Row, Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { TableActionsWrapper } from '../table/table-actions-wrapper'
import { CustomerSettings } from '@/lib/database/schema/customer'
import { hasPermissionByPlan } from '@/data/user.types'

interface Props {
  table: Table<FormattedInventory>
  row: Row<FormattedInventory>
  plan: Plan,
  settings: Pick<CustomerSettings, 'usePlacement'>,
}

export function TableOverviewActions({ table, row, plan, settings }: Props) {
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
      {hasPermissionByPlan(plan, 'basis') && settings.usePlacement && (
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
