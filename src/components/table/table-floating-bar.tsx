import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Kbd } from '@/components/ui/kbd'
import { Separator } from '@/components/ui/separator'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'
import { Row, Table } from '@tanstack/react-table'
import { useEffect } from 'react'

interface TableFloatingBarProps<TData> {
  table: Table<TData>
  children: (table: Table<TData>, rows: Row<TData>[]) => React.ReactNode
}

export function TableFloatingBar<TData>({
  table,
  children,
}: TableFloatingBarProps<TData>) {
  const rows = table.getFilteredSelectedRowModel().rows

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        table.toggleAllRowsSelected(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [table])

  return (
    <div
      className={cn(
        'pointer-events-auto fixed bottom-4 left-1/2 z-10 -translate-x-1/2 rounded-md border bg-popover p-3 opacity-100 shadow-md transition-all duration-300 ease-out',
        rows.length === 0 && 'pointer-events-none translate-y-[150%] opacity-0',
      )}>
      <div className='flex items-center gap-3'>
        <div className='flex items-center'>
          <div className='flex h-9 items-center rounded-bl-md rounded-tl-md border border-r-0 border-dashed px-3'>
            <span className='text-sm'>{rows.length} valgt</span>
          </div>
          <TooltipProvider>
            <Tooltip delayDuration={250}>
              <TooltipTrigger asChild>
                <Button
                  size='icon'
                  variant='outline'
                  className='rounded-bl-none rounded-tl-none border-dashed bg-popover'
                  onClick={() => table.toggleAllRowsSelected(false)}>
                  <Icons.cross className='size-4' />
                </Button>
              </TooltipTrigger>
              <TooltipContent className='flex items-center gap-2'>
                <p>Ryd markering</p>
                <Kbd abbrTitle='Escape' variant='outline'>
                  Esc
                </Kbd>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <Separator orientation='vertical' className='h-9' />
        <div className='flex items-center gap-2'>{children(table, rows)}</div>
      </div>
    </div>
  )
}
