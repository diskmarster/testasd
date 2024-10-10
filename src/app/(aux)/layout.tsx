import { buttonVariants } from '@/components/ui/button'
import { siteConfig } from '@/config/site'
import Link from 'next/link'

export default async function AuxLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className='mt-4'>
      <div className='container flex items-center justify-between'>
        <Link href='/' className='flex items-center space-x-2'>
          <siteConfig.logo className='size-6' strokeWidth={1.5} />
          <span className='inline-block font-semibold'>{siteConfig.name}</span>
        </Link>
        <Link
          className={buttonVariants({ variant: 'default', size: 'sm' })}
          href={'/log-ind'}>
          Log ind eller opret dig
        </Link>
      </div>
      {children}
    </div>
  )
}
