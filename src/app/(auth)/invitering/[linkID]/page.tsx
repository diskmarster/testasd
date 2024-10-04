import { SignUpInvitedCard } from '@/components/auth/sign-up-invited'
import { customerService } from '@/service/customer'
import { userService } from '@/service/user'
import { Metadata } from 'next'
import { redirect } from 'next/navigation'

export const metadata: Metadata = {
  title: 'Invitering',
}

export default async function Page({ params }: { params: { linkID: string } }) {
  const customer = await customerService.getByUserLinkID(params.linkID)
  const inviteLink = await userService.getInviteLinkByID(params.linkID)

  if (!customer || !inviteLink) redirect('/log-ind')

  return (
    <section className='w-full'>
      <SignUpInvitedCard customer={customer} inviteLink={inviteLink} />
    </section>
  )
}
