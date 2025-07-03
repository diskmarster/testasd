'use client'

import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { Column } from '@tanstack/react-table'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider,
} from "@/components/ui/tooltip"

interface TableHeaderProps<TData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<TData, TValue>
  title: string
  multiSort?: boolean
  tooltip?: string
}

export function TableHeader<TData, TValue>({
  column,
  title,
  className,
  multiSort = false,
  tooltip,
}: TableHeaderProps<TData, TValue>) {

  const handleSort = () => {
    const current = column.getIsSorted()
    if (current === 'desc') {
      column.clearSorting()
    } else {
      column.toggleSorting(current === 'asc', multiSort)
    }
  }

  return (
    <div
      className={cn(
        'flex max-w-52',
        // @ts-ignore
        column.columnDef.meta?.rightAlign && 'justify-end',
      )}>
	<TooltipProvider>
		<Tooltip delayDuration={250}>
			<TooltipTrigger asChild>
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
					{tooltip && <Icons.help className='size-3.5' />}
					{column.getIsSorted() === 'desc' ? (
						<Icons.arrowDown className='size-3' />
					) : column.getIsSorted() === 'asc' ? (
						<Icons.arrowUp className='size-3' />
					) : null}
				</Button>
			</TooltipTrigger>
			<TooltipContent className={cn('bg-foreground text-background', !tooltip && 'hidden')}>
				<p>{tooltip}</p>
			</TooltipContent>
		</Tooltip>
	</TooltipProvider>
    </div>
  )
}
