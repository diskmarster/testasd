"use client"

import { useEffect, useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { getChipCount } from "@/lib/utils"

export function NavChip({ id }: { id: string }) {
  const [count, setCount] = useState<number>()

  useEffect(() => {
    if (!count) {
      getChipCount(id).then(c => setCount(c))
    }
  }, [count])

  if (!count || count == 0) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='bg-destructive rounded text-xs py-0.5 px-1 text-destructive-foreground font-semibold'>{count}</span>
        </TooltipTrigger>
        <TooltipContent className="bg-foreground text-background">
          Du har {count} produkter der skal genbestilles
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
