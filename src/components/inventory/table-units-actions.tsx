import { toggleBarredUnitAction } from '@/app/[lng]/(site)/sys/enheder/actions'
import { ModalUpdateUnit } from '@/components/inventory/modal-update-unit'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { siteConfig } from '@/config/site'
import { Unit } from '@/lib/database/schema/inventory'
import { Row, Table } from '@tanstack/react-table'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
  table: Table<Unit>
  row: Row<Unit>
}

export function TableOverviewActions({ table, row }: Props) {
  const [open, setOpen] = useState<boolean>(false)
  const [_, startTransition] = useTransition()
  const handleToggleBar = () => {
    startTransition(async () => {
      const isCurrentlyBarred = row.original.isBarred
      const updatedBarredStatus = !isCurrentlyBarred
      const res = await toggleBarredUnitAction({
        unitID: row.original.id,
        isBarred: updatedBarredStatus,
      })
      if (res && res.serverError) {
        toast.error(siteConfig.errorTitle, {
          description: res.serverError,
        })
        return
      }

      toast.success(siteConfig.successTitle, {
        description: 'Varegruppe opdateret successfuldt',
      })
    })
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
