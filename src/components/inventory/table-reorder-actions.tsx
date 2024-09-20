'use client'

import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { FormattedReorder } from '@/data/inventory.types'
import { Row, Table } from '@tanstack/react-table'
import { TableActionsWrapper } from '../table/table-actions-wrapper'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'

interface Props {
  table: Table<FormattedReorder>
  row: Row<FormattedReorder>
}

export function TableReorderActions({ table, row }: Props) {
  return (
    <div className='flex items-center gap-2'>
      <Button size={'iconMd'} variant={'ghost'}>
        <Icons.plus className='size-4' />
      </Button>
      <TableActionsWrapper>
        <DropdownMenuItem
          onClick={() => {
            //
          }}>
          Rediger
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => {
            //
          }}>
          Slet
        </DropdownMenuItem>
      </TableActionsWrapper>
    </div>
  )
}
