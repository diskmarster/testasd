import { toggleBarredPlacementAction } from '@/app/[lng]/(site)/admin/placeringer/actions'
import { ModalUpdatePlacement } from '@/components/inventory/modal-update-placement'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { siteConfig } from '@/config/site'
import { Placement } from '@/lib/database/schema/inventory'
import { Row } from '@tanstack/react-table'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
  row: Row<Placement>
}

export function TableOverviewActions({ row }: Props) {
  const [open, setOpen] = useState<boolean>(false)
  const [_, startTransition] = useTransition()
  const handleToggleBar = () => {
    startTransition(async () => {
      const isCurrentlyBarred = row.original.isBarred
      const updatedBarredStatus = !isCurrentlyBarred
      const res = await toggleBarredPlacementAction({
        placementID: row.original.id,
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
