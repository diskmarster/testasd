import { SiteWrapper } from '@/components/common/site-wrapper'
import { Separator } from '@/components/ui/separator'
import { customerService } from '@/service/customer'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'

export default async function Page() {
  const { session, user } = await sessionService.validate()
  if (!session) redirect('/log-ind')

  const location = await locationService.getLastVisited(user.id!)
  if (!location) redirect('/log-ind')

  const customer = await customerService.getByID(user.customerID)
  if (!customer) redirect('/log-ind')

  return (
    <SiteWrapper
      title='Firma'
      description='Se, rediger og slet i alt vedrerønde din firma konto'>
      <Separator />
      <div>firma</div>
    </SiteWrapper>
  )
}
