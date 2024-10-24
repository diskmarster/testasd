"use client"

import { useEffect, useState } from "react"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../ui/tooltip"
import { getChipCount } from "@/lib/utils"
import { useLanguage } from "@/context/language"
import { useTranslation } from "@/app/i18n/client"

export function NavChip({ chipLabel, localeKey }: { chipLabel: string, localeKey: string }) {
  const [count, setCount] = useState<number>()
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'common')

  useEffect(() => {
    if (!count) {
      getChipCount(chipLabel).then(c => setCount(c))
    }
  }, [count, chipLabel])

  if (!count || count == 0) return null

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span className='bg-destructive rounded text-xs py-0.5 px-1 text-destructive-foreground font-semibold'>{count}</span>
        </TooltipTrigger>
        <TooltipContent className="bg-foreground text-background">
          {t(localeKey, { context: 'count', count })}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  )
}
