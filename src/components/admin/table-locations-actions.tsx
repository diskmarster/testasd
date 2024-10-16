'use client'

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { Location } from '@/lib/database/schema/customer'
import { Row, Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { TableActionsWrapper } from '../table/table-actions-wrapper'
import { useLanguage } from '@/context/language'
import { useTranslation } from '@/app/i18n/client'
interface Props {
  table: Table<Location>
  row: Row<Location>
}

export function TableLocationsActions({ table, row }: Props) {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')

  return (
    <TableActionsWrapper>
      <DropdownMenuItem
        onClick={() => {
          emitCustomEvent('EditLocationByID', {
            locationID: row.original.id,
            name: row.original.name,
          })
        }}>
        {t('table-locations-actions.update')}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => {
          emitCustomEvent('ToggleLocationByID', {
            locationIDs: [row.original.id],
            status: row.original.isBarred,
          })
        }}>
        {t('table-locations-actions.toggle-status')}
      </DropdownMenuItem>
    </TableActionsWrapper>
  )
}
