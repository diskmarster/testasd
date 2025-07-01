'use client'

import { Button } from '@/components/ui/button'
import { TableCell } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import { Row, flexRender } from '@tanstack/react-table'
import { Icons } from '../ui/icons'

interface Props<T> {
  row: Row<T>
}

export function TableGroupedCell<T>({ row }: Props<T>) {
  const canExpand = row.getLeafRows().length >= 1

  return (
    <>
      {row.getVisibleCells().map(cell => (
				// @ts-ignore
				!cell.getContext().column.columnDef.meta?.isShadow && (
        <TableCell
          key={cell.id}
          className={cn(
						"w-fit",
            cell.getIsGrouped() || cell.getIsAggregated() ? 'bg-muted/30' : '',
					)}
					align={
							/* @ts-ignore*/
							cell.column.columnDef.meta?.rightAlign 
								? 'right' 
								: 'left'
						}>
          {cell.getIsGrouped() ? (
            <div className='flex items-center gap-2'>
              <Button
                onClick={row.getToggleExpandedHandler()}
                variant='ghost'
                className='h-6 w-6 p-0 data-[state=open]:bg-muted'
                disabled={!canExpand}>
                <>
                  <span className='sr-only'>Åben række</span>
                  <Icons.chevronRight
                    className={cn('h-4 w-4 transition-all', !canExpand && 'opacity-50', row.getIsExpanded() && 'rotate-90')}
                  />
                </>
              </Button>
              {flexRender(cell.column.columnDef.cell, cell.getContext())}
            </div>
          ) : cell.getIsAggregated() ? (
            <div
              className={cn(
                'flex max-w-52',
                // @ts-ignore
                cell.column.columnDef.meta?.rightAlign && 'justify-end',
                typeof cell.getValue() == 'number' && 'justify-end',
                Array.isArray(cell.getValue<number | number[]>()) &&
                cell
                  .getValue<number[]>()
                  .every(item => typeof item === 'number') &&
                'justify-end',
                // @ts-ignore
                cell.column.columnDef.meta?.className &&
                // @ts-ignore
                cell.column.columnDef.meta.className,
              )}>
              {cell.column.columnDef.aggregationFn && (
                <div className='truncate flex items-center'>
                  {flexRender(
                    cell.column.columnDef.aggregatedCell ??
                    cell.column.columnDef.cell,
                    cell.getContext(),
                  )}
                </div>
              )}
            </div>
          ) : cell.getIsPlaceholder() ? null : (
            <div
              className={cn(
                'flex max-w-52',
                // @ts-ignore
                cell.column.columnDef.meta?.rightAlign && 'justify-end',
                typeof cell.getValue() == 'number' && 'justify-end',
                Array.isArray(cell.getValue<number | number[]>()) &&
                cell
                  .getValue<number[]>()
                  .every(item => typeof item === 'number') &&
                'justify-end',
                // @ts-ignore
                cell.column.columnDef.meta?.className &&
                // @ts-ignore
                cell.column.columnDef.meta.className,
              )}>
              <div className='truncate flex items-center'>
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </div>
            </div>
          )}
        </TableCell>
				)
      ))}
    </>
  )
}
