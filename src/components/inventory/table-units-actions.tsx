import { toggleBarredUnitAction } from '@/app/(site)/sys/enheder/actions'
import { ModalUpdateUnit } from '@/components/inventory/modal-update-unit'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Unit } from '@/lib/database/schema/inventory'
import { Row, Table } from '@tanstack/react-table'
import { useState } from 'react'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
  table: Table<Unit>
  row: Row<Unit>
}

export function TableOverviewActions({ table, row }: Props) {
  const [open, setOpen] = useState<boolean>(false)
  const handleToggleBar = async () => {
    const isCurrentlyBarred = row.original.isBarred
    const updatedBarredStatus = !isCurrentlyBarred
    const result = await toggleBarredUnitAction(
      row.original.id,
      updatedBarredStatus,
    )
  }

  return (
    <>
      <TableActionsWrapper>
        <DropdownMenuItem onClick={() => setOpen(true)}>
          Rediger enhed
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleBar}>
          {row.original.isBarred ? 'Ophæv spærring' : 'Spær'}
        </DropdownMenuItem>
      </TableActionsWrapper>

      <ModalUpdateUnit
        unitToEdit={row.original}
        isOpen={open}
        setOpen={setOpen}
      />
    </>
  )
}
