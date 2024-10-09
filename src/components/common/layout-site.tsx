import { Header } from '@/components/common/header'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

export default async function LayoutSite({
  children,
  params: { lng },
}: Readonly<{
  children: React.ReactNode
  params: {
    lng: string
  }
}>) {
  const { session } = await sessionService.validate()
  if (!session) {
    return redirect(`/${lng}/log-ind`)
  }
  return (
    <div className='relative flex min-h-screen flex-col'>
      <Header lng={lng} />
      <main className='flex-1'>{children}</main>
    </div>
  )
}
