import { signOutAction } from '@/app/(auth)/log-ud/actions'
import { ModalEditLocation } from '@/components/admin/modal-edit-location'
import { ModalResetUserPW } from '@/components/admin/modal-reset-user-pw'
import { ModalToggleLocation } from '@/components/admin/modal-toggle-location'
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
  const userAccesses = await locationService.getAccessesByCustomerID(customer.id)

  return (
    <SiteWrapper
      title='Organisation'
      description='Se og rediger i brugere, lokationer og firmainformation'>
      <TabsAdmin
        customer={customer}
        user={user}
        locations={locations}
        users={users}
        currentLocationID={location}
      />

      {/* Modals without triggers that we open with custom events from row actions */}
      <ModalToggleUser users={users} />
      <ModalResetUserPW users={users} />
      <ModalEditLocation user={user} users={users} userAccesses={userAccesses} />
      <ModalToggleLocation />
    </SiteWrapper>
  )
}
