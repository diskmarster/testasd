import { siteConfig } from '@/config/site'
import { sessionService } from '@/service/session'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { buttonVariants } from '../ui/button'

export default async function LayoutAuth({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { session } = await sessionService.validate()
  if (session) redirect('/oversigt')
  return (
    <div className='w-full md:min-h-screen'>
      <div className='container pt-4 flex items-center h-14 justify-between'>
        <Link href='/' className='flex items-center space-x-2'>
          <siteConfig.logo className='size-6' strokeWidth={1.5} />
          <span className='inline-block font-semibold'>{siteConfig.name}</span>
        </Link>
        <Link
          className={buttonVariants({ variant: 'ghost' })}
          href={'/faq'}>
          F.A.Q
        </Link>
      </div>
      <div className='flex w-full items-center justify-center min-h-[calc(100dvh-56px)] py-12'>
        {children}
      </div>
    </div>
  )
}
