import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { exportTableToCSV } from '@/lib/export/csv'
import { Table } from '@tanstack/react-table'
import { useTransition } from 'react'

export function ExportSelectedButton<TData>({
  table,
}: {
  table: Table<TData>
}) {
  const [pending, startTransition] = useTransition()
  return (
    <Button
      variant='outline'
      size='icon'
      className='bg-popover'
      disabled={pending}
      onClick={() => {
        startTransition(() => {
          exportTableToCSV(table, {
            excludeColumns: ['select', 'actions'],
            onlySelected: true,
          })
        })
      }}>
      {pending ? (
        <Icons.spinner className='size-4 animate-spin' />
      ) : (
        <Icons.download className='size-4' />
      )}
    </Button>
  )
}
