import { toggleBarredPlacementAction } from '@/app/[lng]/(site)/admin/placeringer/actions'
import { useTranslation } from '@/app/i18n/client'
import { ModalUpdatePlacement } from '@/components/inventory/modal-update-placement'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { Placement } from '@/lib/database/schema/inventory'
import { Row } from '@tanstack/react-table'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
  row: Row<Placement>
}

export function TableOverviewActions({ row }: Props) {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'placeringer')

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
          {t('table-placement-actions.update')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleBar}>
          {row.original.isBarred
            ? t('table-placement-actions.unbar')
            : t('table-placement-actions.bar')}
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
