'use client'

import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { useState } from 'react'

export function ButtonCopy({ text, className }: { text: string, className?: string }) {
  const [copied, setCopied] = useState(false)

  return copied ? (
    <Icons.check className='size-4 text-success' />
  ) : (
    <Icons.copy
      className={cn('size-4 cursor-pointer text-foreground', className)}
      onClick={() => {
        navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
    />
  )
}
