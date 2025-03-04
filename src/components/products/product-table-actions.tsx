import { useTranslation } from '@/app/i18n/client'
import { DropdownMenuItem } from '@/components/ui/dropdown-menu'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { FormattedProduct } from '@/data/products.types'
import { Row, Table } from '@tanstack/react-table'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { TableActionsWrapper } from '../table/table-actions-wrapper'
import { toggleBarredProductAction } from '@/app/[lng]/(site)/varer/produkter/actions'
import Link from 'next/link'

interface Props {
  table: Table<FormattedProduct>
  row: Row<FormattedProduct>
}

export function TableOverviewActions({ table, row }: Props) {
  const [_, startTransition] = useTransition()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'produkter')

  const handleToggleBar = () => {
    startTransition(async () => {
      const isCurrentlyBarred = row.original.isBarred
      const updatedBarredStatus = !isCurrentlyBarred
      const res = await toggleBarredProductAction({
        productID: row.original.id,
        isBarred: updatedBarredStatus,
      })

      if (res && res.serverError) {
        toast.error(t(`common:${siteConfig.errorTitle}`), {
          description: res.serverError,
        })
        return
      }

      toast.success(t(`common:${siteConfig.successTitle}`), {
        description: t('toasts.product-updated'),
      })
    })
  }

  return (
    <>
      <TableActionsWrapper>
        <DropdownMenuItem asChild>
		<Link href={`/${lng}/varer/produkter/${row.original.id}`}>
          {t('view-product')}
		</Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleToggleBar}>
          {row.original.isBarred ? t('unbar-this') : t('bar-this')}
        </DropdownMenuItem>
      </TableActionsWrapper>
    </>
  )
}
