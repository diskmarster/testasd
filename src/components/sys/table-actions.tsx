'use client'

import { useTranslation } from '@/app/i18n/client'
import {
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/context/language'
import { useSession } from '@/context/session'
import { UserNoHashWithCompany } from '@/data/user.types'
import { Row, Table } from '@tanstack/react-table'
import { emitCustomEvent } from 'react-custom-events'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
  table: Table<UserNoHashWithCompany>
  row: Row<UserNoHashWithCompany>
}

export function TableSysUsersActions({ table, row }: Props) {
  const { user } = useSession()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'organisation')

  if (!user) {
    return null
  }

  const { role: sessionUserRole, id: sessionUserID } = user

  const isSignedInUser = row.original.id == sessionUserID
  const isUserRegistered = row.original.name != '-'

  const tooltipContent = isSignedInUser
    ? t('table-users-actions.same-user-tooltip')
    : undefined

  if (!isUserRegistered) {
    return (
      <TableActionsWrapper>
        <DropdownMenuItem
          onClick={() => {
            console.log("send nyt link")
          }}>
          Send nyt link
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className='!text-destructive'
          onClick={() => {
            emitCustomEvent('DeleteClientByID', {
              customerID: row.original.id,
            })
          }}>
          Slet
        </DropdownMenuItem>
      </TableActionsWrapper>
    )
  }

  return (
    <TableActionsWrapper
      disabled={isSignedInUser}
      tooltipContent={tooltipContent}>
      <DropdownMenuItem
        onClick={() => {
          emitCustomEvent('EditUserByID', {
            user: row.original,
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
        onClick={() => {
          emitCustomEvent('ResetUserPinByID', {
            userID: row.original.id,
            email: row.original.email,
          })
        }}>
        {t('table-users-actions.reset-pin')}
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem
        className='!text-destructive'
        onClick={() => {
          emitCustomEvent('DeleteClientByID', {
            customerID: row.original.id,
          })
        }}>
        Slet
      </DropdownMenuItem>
    </TableActionsWrapper>
  )
}
