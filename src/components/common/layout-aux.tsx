import { buttonVariants } from '@/components/ui/button'
import { siteConfig } from '@/config/site'
import Link from 'next/link'
import { ThemeToggle } from './theme-toggle'

export default async function AuxLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='w-full md:min-h-screen'>
      <div className='container pt-4 flex items-center h-14 justify-between'>
        <Link href='/' className='flex items-center space-x-2'>
          <siteConfig.logo className='size-6' strokeWidth={1.5} />
          <span className='inline-block font-semibold'>{siteConfig.name}</span>
        </Link>
        <div className='flex items-center gap-2'>

          <ThemeToggle />
          <Link
            className={buttonVariants({ variant: 'default' })}
            href={'/log-ind'}>
            Log ind eller opret dig
          </Link>
        </div>
      </div>
      <div className='flex w-full justify-center min-h-[calc(100dvh-56px)]'>

        {children}
      </div>
    </div>
  )
}
