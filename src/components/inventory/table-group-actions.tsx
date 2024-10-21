import { toggleBarredGroupAction } from '@/app/(site)/admin/varegrupper/actions'
import { ModalUpdateGroup } from '@/components/inventory/modal-update-group'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { siteConfig } from '@/config/site'
import { Group } from '@/lib/database/schema/inventory'
import { Row, Table } from '@tanstack/react-table'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
  row: Row<Group>
}

export function TableOverviewActions({ row }: Props) {
  const [open, setOpen] = useState<boolean>(false)
  const [_, startTransition] = useTransition()

  const handleToggleBar = () => {
    startTransition(async () => {
      const isCurrentlyBarred = row.original.isBarred
      const updatedBarredStatus = !isCurrentlyBarred
      const res = await toggleBarredGroupAction({
        groupID: row.original.id,
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
