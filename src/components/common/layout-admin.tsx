import { signOutAction } from '@/app/(auth)/log-ud/actions'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

export default async function LayoutAdmin({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const { session, user } = await sessionService.validate()
  if (!session) return redirect('/log-ind')
  if (user.role == 'bruger') return redirect('/oversigt')
  return <>{children}</>
}
