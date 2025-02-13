'use client'

import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { Column } from '@tanstack/react-table'

interface TableHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
}

export function TableHeader<TData, TValue>({
  column,
  title,
  className,
}: TableHeaderProps<TData, TValue>) {

  const handleSort = () => {
    column.toggleSorting(column.getIsSorted() === 'asc')
  }

  return (
    <div
      className={cn(
        'flex',
        // @ts-ignore
        column.columnDef.meta?.rightAlign && 'justify-end',
      )}>
      <Button
        disabled={!column.getCanSort()}
        variant='link'
        size='sm'
        className={cn(
          'flex items-center gap-1 p-0 font-semibold !text-muted-foreground !opacity-100',
          className,
          // @ts-ignore
          column.columnDef.meta?.rightAlign && 'justify-end',
        )}
        onClick={handleSort}>
        {title}
        {column.getIsSorted() === 'desc' ? (
          <Icons.arrowDown className='size-3' />
        ) : column.getIsSorted() === 'asc' ? (
          <Icons.arrowUp className='size-3' />
        ) : null}
      </Button>
    </div>
  )
}
