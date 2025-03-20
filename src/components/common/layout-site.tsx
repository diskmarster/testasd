import { Header } from '@/components/common/header'
import { isMaintenanceMode } from '@/lib/utils.server'
import { redirect } from 'next/navigation'
import { withAuth, WithAuthProps } from './with-auth'

interface Props extends WithAuthProps {
  children: React.ReactNode
  params: {
    lng: string
  }
}

async function LayoutSite({
  children,
  params: { lng },
  user,
  customer,
}: Readonly<Props>) {
  if (isMaintenanceMode()) {
    return redirect(`/${lng}/maintenance`)
  }

  return (
    <div className='relative flex min-h-screen flex-col'>
      <Header lng={lng} user={user} customer={customer} />
      <main className='flex-1'>{children}</main>
    </div>
  )
}

export default withAuth(LayoutSite)
