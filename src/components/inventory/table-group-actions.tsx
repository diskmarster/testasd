import { toggleBarredGroupAction } from '@/app/[lng]/(site)/admin/varegrupper/actions'
import { useTranslation } from '@/app/i18n/client'
import { ModalUpdateGroup } from '@/components/inventory/modal-update-group'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { siteConfig } from '@/config/site'
import { LanguageContext } from '@/context/language'
import { Group } from '@/lib/database/schema/inventory'
import { Row } from '@tanstack/react-table'
import { useContext, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { TableActionsWrapper } from '../table/table-actions-wrapper'

interface Props {
  row: Row<Group>
}

export function TableOverviewActions({ row }: Props) {
  const lng = useContext(LanguageContext)
  const { t } = useTranslation(lng, 'varegrupper')
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
          {t('product-group-actions.update')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleBar}>
          {row.original.isBarred
            ? t('product-group-actions.unbar-product-group')
            : t('product-group-actions.bar-product-group')}
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
