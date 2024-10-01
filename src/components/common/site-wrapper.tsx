import { cn } from '@/lib/utils'

export function SiteWrapper({
  children,
  fullWidth,
  noPadding,
  title,
  description,
  actions,
}: {
  children: React.ReactNode
  fullWidth?: boolean
  noPadding?: boolean
  title?: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div
      className={cn(
        'flex flex-col pb-6',
        !fullWidth && 'container',
        !noPadding && 'gap-4 pt-4',
      )}>
      <div className='flex w-full'>
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
        {actions && <div className='flex items-center gap-2'>{actions}</div>}
      </div>
      {children}
    </div>
  )
}
