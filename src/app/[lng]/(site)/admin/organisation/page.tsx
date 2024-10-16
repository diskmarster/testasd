import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n'
import { ModalEditLocation } from '@/components/admin/modal-edit-location'
import { ModalResetUserPW } from '@/components/admin/modal-reset-user-pw'
import { ModalToggleLocation } from '@/components/admin/modal-toggle-location'
import { ModalToggleUser } from '@/components/admin/modal-toggle-user'
import { TabsAdmin } from '@/components/admin/tabs-company'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { useLanguage } from '@/context/language'
import { customerService } from '@/service/customer'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { userService } from '@/service/user'

interface PageProps {
  params: {
    lng: string
  }
}

export default async function Page( { params: { lng } }: PageProps ) {
  const { t } = await serverTranslation(lng, 'organisation')
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
      <ModalToggleUser users={users} />
      <ModalResetUserPW users={users} />
      <ModalEditLocation user={user} users={users} userAccesses={userAccesses} />
      <ModalToggleLocation />
    </SiteWrapper>
  )
}
