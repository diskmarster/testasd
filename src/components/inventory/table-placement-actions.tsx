import { toggleBarredPlacementAction } from '@/app/(site)/admin/placeringer/actions'
import { ModalUpdatePlacement } from '@/components/inventory/modal-update-placement'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { Placement } from '@/lib/database/schema/inventory'
import { Row, Table } from '@tanstack/react-table'
import { useState } from 'react'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
  table: Table<Placement>
  row: Row<Placement>
}

export function TableOverviewActions({ table, row }: Props) {
  const [open, setOpen] = useState<boolean>(false)
  const handleToggleBar = async () => {
    const isCurrentlyBarred = row.original.isBarred
    const updatedBarredStatus = !isCurrentlyBarred
    const result = await toggleBarredPlacementAction(
      row.original.id,
      updatedBarredStatus,
    )
  }

  return (
    <>
      <TableActionsWrapper>
        <DropdownMenuItem onClick={() => setOpen(true)}>
          Rediger placering
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleBar}>
          {row.original.isBarred ? 'Ophæv spærring' : 'Spær'}
        </DropdownMenuItem>
      </TableActionsWrapper>

      <ModalUpdatePlacement
        placementToEdit={row.original}
        isOpen={open}
        setOpen={setOpen}
      />
    </>
  )
}
