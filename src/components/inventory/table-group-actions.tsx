import { ModalUpdatePlacement } from '@/components/inventory/modal-update-placement'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Group } from '@/lib/database/schema/inventory'
import { Row, Table } from '@tanstack/react-table'
import { useState } from 'react'
import { TableActionsWrapper } from '../table/table-actions-wrapper'
import { toggleBarredGroupAction } from '@/app/(site)/admin/varegrupper/actions'
import { ModalUpdateGroup } from '@/components/inventory/modal-update-group'

interface Props {
  table: Table<Group>
  row: Row<Group>
}

export function TableOverviewActions({ table, row }: Props) {
  const [open, setOpen] = useState<boolean>(false)
  const handleToggleBar = async () => {
    const isCurrentlyBarred = row.original.isBarred
    const updatedBarredStatus = !isCurrentlyBarred
    const result = await toggleBarredGroupAction(
      row.original.id,
      updatedBarredStatus,
    )
  }

  return (
    <>
      <TableActionsWrapper>
        <DropdownMenuItem onClick={() => setOpen(true)}>
          Rediger varegruppe
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleBar}>
          {row.original.isBarred ? 'Ophæv spærring' : 'Spær'}
        </DropdownMenuItem>
      </TableActionsWrapper>

      <ModalUpdateGroup
        groupToEdit={row.original}
        isOpen={open}
        setOpen={setOpen}
      />
    </>
  )
}
