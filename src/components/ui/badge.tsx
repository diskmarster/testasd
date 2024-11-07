import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80',
        secondary:
          'border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80',
        destructive:
          'border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80',
        outline: 'text-foreground',
        success: 'bg-success text-success-foreground border-transparent',
        warning: 'bg-warning text-warning-foreground border-transparent',
        wow: 'bg-gradient-to-r from-violet-500 to-purple-500 text-white',
        yellow: 'bg-yellow-400/25 border-yellow-400/50 dark:text-yellow-500 text-yellow-600',
        red: 'bg-red-500/25 border-red-500/50 text-red-500',
        green: 'bg-green-500/25 border-green-500/50 dark:text-green-500 text-green-600',
        gray: 'bg-slate-500/25 border-slate-500/50 dark:text-slate-500 text-slate-600',
        lessGray: 'bg-slate-500/10 border-slate-500/50 dark:text-slate-500 text-slate-600',
        blue: 'bg-blue-500/25 border-blue-500/50 dark:text-blue-500 text-blue-600',
        teal: 'bg-teal-500/25 border-teal-500/50 dark:text-teal-500 text-teal-600',
        orange: 'bg-orange-500/25 border-orange-500/50 dark:text-orange-500 text-orange-600',
        rose: 'bg-rose-500/25 border-rose-500/50 dark:text-rose-500 text-rose-600',
        violet: 'bg-gradient-to-r from-violet-500/25 to-purple-500/25 border-violet-500/50 dark:text-violet-500 text-violet-600',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> { }

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
