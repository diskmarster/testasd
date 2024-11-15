import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n'
import { ModalEditLocation } from '@/components/admin/modal-edit-location'
import { ModalEditUser } from '@/components/admin/modal-edit-user'
import { ModalResetUserPin } from '@/components/admin/modal-reset-user-pin'
import { ModalResetUserPW } from '@/components/admin/modal-reset-user-pw'
import { ModalToggleLocation } from '@/components/admin/modal-toggle-location'
import { ModalToggleUser } from '@/components/admin/modal-toggle-user'
import { TabsAdmin } from '@/components/admin/tabs-company'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { getUserRoles, hasPermissionByRank, lte } from '@/data/user.types'
import { customerService } from '@/service/customer'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'
import { redirect } from 'next/navigation'

interface PageProps {
  params: {
    lng: string
  }
}

export default async function Page({ params: { lng } }: PageProps) {
  const { t } = await serverTranslation(lng, 'organisation')
  const { session, user } = await sessionService.validate()
  if (!session) {
    signOutAction()
    return
  }

  if (!hasPermissionByRank(user.role, 'moderator')) {
    redirect("/oversigt")
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

  let locations = await locationService.getByCustomerID(customer.id)
  let users = await userService.getAllByCustomerID(customer.id)
  const userAccesses = await locationService.getAccessesByCustomerID(customer.id)

  if (user.role == 'moderator') {
    const signedInUserLocations = await locationService.getAllByUserID(user.id)

    const userIDsToView = userAccesses.filter(acc => signedInUserLocations.some(loc => loc.id == acc.locationID)).map(acc => acc.userID)

    users = users.filter(u => userIDsToView.some(uID => u.id == uID))
    locations = locations.filter(l => signedInUserLocations.some(uL => l.id == uL.id))
  }

  return (
    <SiteWrapper
      title={t('organisation-page.title')}
      description={t('organisation-page.description')}>
      <TabsAdmin
        customer={customer}
        user={user}
        locations={locations}
        users={users}
        currentLocationID={location}
      />

      {/* Modals without triggers that we open with custom events from row actions */}
      <ModalEditUser />
      <ModalToggleUser />
      <ModalResetUserPW />
      <ModalResetUserPin />
      <ModalEditLocation user={user} users={users} userAccesses={userAccesses} />
      <ModalToggleLocation />
    </SiteWrapper>
  )
}
