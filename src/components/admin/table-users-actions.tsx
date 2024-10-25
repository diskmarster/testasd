'use client'

import { useTranslation } from '@/app/i18n/client'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/context/language'
import { useSession } from '@/context/session'
import { hasPermissionByRank } from '@/data/user.types'
import { UserNoHash } from '@/lib/database/schema/auth'
import { Row, Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
  table: Table<UserNoHash>
  row: Row<UserNoHash>
}

export function TableUsersActions({ table, row }: Props) {
  const { user } = useSession()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')

  if (!user) {
    return null
  }

  const { role: sessionUserRole, id: sessionUserID } = user

  const hasPermission = hasPermissionByRank(sessionUserRole, row.original.role)
  const isSignedInUser = row.original.id == sessionUserID

  const tooltipContent = !hasPermission
    ? t('table-users-actions.no-permission-tooltip')
    : isSignedInUser
      ? t('table-users-actions.same-user-tooltip')
      : undefined

  return (
    <TableActionsWrapper
      disabled={!hasPermission || isSignedInUser}
      tooltipContent={tooltipContent}>
      <DropdownMenuItem
        onClick={() => {
          emitCustomEvent('EditUserByID', {
            userID: row.original.id,
          })
        }}>
        {t('table-users-actions.edit-user')}
      </DropdownMenuItem>
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
