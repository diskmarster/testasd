'use client'

import { Row, flexRender } from '@tanstack/react-table'
import { TableCell } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import { number, unknown } from 'zod'

interface Props<T> {
  row: Row<T>
}

export function TableGroupedCell<T>({ row }: Props<T>) {
  const canExpand = row.getLeafRows().length >= 1

  return (
    <>
      {row.getVisibleCells().map(cell => (
        <TableCell
          key={cell.id}
          className={
            cell.getIsGrouped() || cell.getIsAggregated() ? 'bg-muted/30' : ''
          }>
          {cell.getIsGrouped() ? (
            <div className='flex items-center gap-2'>
              <Button
                onClick={row.getToggleExpandedHandler()}
                variant='ghost'
                className='h-6 w-6 p-0 data-[state=open]:bg-muted'
                disabled={!canExpand}>
                {row.getIsExpanded() ? (
                  <>
                    <span className='sr-only'>Kollaps række</span>
                    <ChevronDown className='h-4 w-4' />
                  </>
                ) : (
                  <>
                    <span className='sr-only'>Åben række</span>
                    <ChevronRight
                      className={cn('h-4 w-4', !canExpand && 'opacity-50')}
                    />
                  </>
                )}
              </Button>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          ) : cell.getIsAggregated() ? (
            <div className={cn(
              'flex whitespace-nowrap',
              typeof cell.getValue() == 'number' && 'justify-end',
              Array.isArray(cell.getValue<number | number[]>()) && cell.getValue<number[]>().every(item => typeof item === 'number') && 'justify-end'
            )}>
              {cell.column.columnDef.aggregationFn && (
                <>
                  {flexRender(
                    cell.column.columnDef.aggregatedCell ??
                    cell.column.columnDef.cell,
                    cell.getContext(),
                  )}
                </>
              )}
            </div>
          ) : cell.getIsPlaceholder() ? null : (
            <div className={cn(
              'flex whitespace-nowrap',
              typeof cell.getValue() == 'number' && 'justify-end',
              Array.isArray(cell.getValue<number | number[]>()) && cell.getValue<number[]>().every(item => typeof item === 'number') && 'justify-end'
            )}>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          )}
        </TableCell>
      ))}
    </>
  )
}
