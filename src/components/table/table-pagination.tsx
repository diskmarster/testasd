'use client'

import { useTranslation } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useLanguage } from '@/context/language'
import { Table } from '@tanstack/react-table'
import { useEffect } from 'react'

export function TablePagination<TData>({
  table,
  pageSizes = [10, 20, 30, 40, 50],
}: {
  table: Table<TData>
  pageSizes?: number[]
}) {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'common')
  useEffect(() => {
    if (
      !table.getState().pagination.pageSize ||
      !pageSizes.includes(table.getState().pagination.pageSize)
    ) {
      table.setPageSize(pageSizes[0])
    }
  })

  return (
    <div className='flex items-center justify-between mt-4'>
      <div className='flex items-center space-x-4'>
        <Select
          value={`${table.getState().pagination.pageSize}`}
          onValueChange={value => {
            table.setPageSize(Number(value))
          }}>
          <SelectTrigger className='w-[80px]'>
            <SelectValue placeholder={table.getState().pagination.pageSize} />
          </SelectTrigger>
          <SelectContent side='top'>
            {pageSizes.map(pageSize => (
              <SelectItem key={pageSize} value={`${pageSize}`}>
                {pageSize}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className='text-sm font-medium text-muted-foreground hidden md:block'>
          {t('table-pagination.rows-per-page')} (
          {table.getFilteredRowModel().rows.length} total)
        </p>
      </div>
      <div className='space-x-2'>
        <Button
          variant='outline'
          size='icon'
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
          aria-label='Go to previous page'>
          <Icons.arrowLeft className='size-4' />
          <span className='sr-only'>
            {t('table-pagination.go-to-previous-page')}
          </span>
        </Button>
        <Button
          variant='outline'
          size='icon'
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
          aria-label='Go to next page'>
          <Icons.arrowRight className='size-4' />
          <span className='sr-only'>
            {t('table-pagination.go-to-next-page')}
          </span>
        </Button>
      </div>
    </div>
  )
}
