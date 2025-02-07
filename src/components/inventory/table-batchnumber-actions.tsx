import { useTranslation } from '@/app/i18n/client'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { siteConfig } from '@/config/site'
import { LanguageContext } from '@/context/language'
import { Batch } from '@/lib/database/schema/inventory'
import { Row } from '@tanstack/react-table'
import { useContext, useTransition } from 'react'
import { emitCustomEvent } from 'react-custom-events'
import { toast } from 'sonner'
import { TableActionsWrapper } from '../table/table-actions-wrapper'
import { toggleBarredBatchAction } from '@/app/[lng]/(site)/varer/batch/actions'

interface Props {
  row: Row<Batch>
}

export function TableBatchActions({ row }: Props) {
  const lng = useContext(LanguageContext)
  const { t } = useTranslation(lng, 'batch')
  const [_, startTransition] = useTransition()

  const handleToggleBar = () => {
    startTransition(async () => {
      const isCurrentlyBarred = row.original.isBarred
      const updatedBarredStatus = !isCurrentlyBarred
      const res = await toggleBarredBatchAction({
        batchID: row.original.id,
        isBarred: updatedBarredStatus,
      })
      if (res && res.serverError) {
        toast.error(t(`common:${siteConfig.errorTitle}`), {
          description: res.serverError,
        })
        return
      }

      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: t('batch-table-actions.toast-success'),
      })
    })
  }

  return (
    <>
      <TableActionsWrapper>
        <DropdownMenuItem
          onClick={() =>
            emitCustomEvent('UpdateBatchByID', { batch: row.original })
          }>
          {t('batch-table-actions.update')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleBar}>
          {row.original.isBarred
            ? t('batch-table-actions.unbar')
            : t('batch-table-actions.bar')}
        </DropdownMenuItem>
      </TableActionsWrapper>
    </>
  )
}
