'use client'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Icons } from '@/components/ui/icons'
import { forwardRef, ReactNode } from 'react'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '../ui/tooltip'

interface Props {
  children: ReactNode
  disabled?: boolean
  tooltipContent?: string
}

export function TableActionsWrapper({
  children,
  disabled = false,
  tooltipContent,
}: Props) {
  return (
    <DropdownMenu>
      <TableActionsTrigger
        disabled={disabled}
        tooltipContent={tooltipContent}
      />
      <DropdownMenuContent align='end'>{children}</DropdownMenuContent>
    </DropdownMenu>
  )
}

const TableActionsTrigger = forwardRef<
  HTMLButtonElement,
  { tooltipContent?: string; disabled: boolean }
>(({ tooltipContent, disabled }, ref) => {
  if (tooltipContent) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger ref={ref} asChild>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' size='iconSm' disabled={disabled}>
                <Icons.horizontalDots className='size-4' />
              </Button>
            </DropdownMenuTrigger>
          </TooltipTrigger>
          <TooltipContent className='bg-foreground text-background'>
            {tooltipContent}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  } else {
    return (
      <DropdownMenuTrigger asChild>
        <Button ref={ref} variant='ghost' size='iconSm' disabled={disabled}>
          <Icons.horizontalDots className='size-4' />
        </Button>
      </DropdownMenuTrigger>
    )
  }
})
TableActionsTrigger.displayName = 'TableActionsTrigger'
