'use client'

import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { UserNoHash } from '@/lib/database/schema/auth'
import { Row, Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { TableActionsWrapper } from '../table/table-actions-wrapper'
import { useLanguage } from '@/context/language'
import { useTranslation } from '@/app/i18n/client'

interface Props {
  table: Table<UserNoHash>
  row: Row<UserNoHash>
}

export function TableUsersActions({ table, row }: Props) {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')
  return (
    <TableActionsWrapper>
      <DropdownMenuItem
        onClick={() => {
          emitCustomEvent('ToggleUserByID', {
            userIDs: [row.original.id],
          })
        }}>
        {t('table-users-actions.toggle-status')}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        onClick={() => {
          emitCustomEvent('ResetUserPasswordByID', {
            userID: row.original.id,
            email: row.original.email,
          })
        }}>
        {t('table-users-actions.reset-password')}
      </DropdownMenuItem>
      <DropdownMenuItem
        disabled
        onClick={() => {
          emitCustomEvent('DeleteReorderByIDs', {
            foo: 'foo',
          })
        }}>
        {t('table-users-actions.reset-pin')}
      </DropdownMenuItem>
    </TableActionsWrapper>
  )
}
