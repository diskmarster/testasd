import { signOutAction } from '@/app/(auth)/log-ud/actions'
import { ModalToggleUser } from '@/components/admin/modal-toggle-user'
import { TabsAdmin } from '@/components/admin/tabs-company'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { customerService } from '@/service/customer'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'

export default async function Page() {
  const { session, user } = await sessionService.validate()
  if (!session) {
    signOutAction()
    return
  }

  const location = await locationService.getLastVisited(user.id)
  if (!location) {
    signOutAction()
    return
  }

  const customer = await customerService.getByID(user.customerID)
  if (!customer) {
    signOutAction()
    return
  }

  const locations = await locationService.getByCustomerID(customer.id)
  const users = await userService.getAllByCustomerID(customer.id)

  return (
    <SiteWrapper
      title='Firma'
      description='Se, rediger og slet i alt vedrerønde din firma konto'>
      <TabsAdmin
        customer={customer}
        user={user}
        locations={locations}
        users={users}
        currentLocationID={location}
      />

      {/* Modals without triggers that we open with custom events from row actions */}
      <ModalToggleUser users={users} />
    </SiteWrapper>
  )
}
