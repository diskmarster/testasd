import { cn } from '@/lib/utils'
import { HTMLProps } from 'react'

interface Props extends HTMLProps<HTMLDivElement> {
  children: React.ReactNode
  fullWidth?: boolean
  noPadding?: boolean
  title?: string
  description?: string
  actions?: React.ReactNode
}

export function SiteWrapper({
  children,
  fullWidth,
  noPadding,
  title,
  description,
  actions,
  className,
  ...props
}: Props) {
  return (
    <div
      {...props}
      className={cn(
        'flex flex-col pb-6 scroll-smooth',
        className,
        !fullWidth && 'container',
        !noPadding && 'gap-4 pt-4',
      )}>
      {(title || description || actions) && (
        <div className='flex w-full'>
          {(title || description) && (
            <div className='flex-1'>
              {title && (
                <h1 className='whitespace-balance max-w-xl text-xl font-semibold leading-tight tracking-tighter md:text-2xl'>
                  {title}
                </h1>
              )}
              {description && (
                <p className='text-muted-foreground'>{description}</p>
              )}
            </div>
          )}
          {actions && <div className='flex items-center gap-2'>{actions}</div>}
        </div>
      )}
      {children}
    </div>
  )
}
