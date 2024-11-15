import { serverTranslation } from "@/app/i18n"
import { SiteWrapper } from "@/components/common/site-wrapper"
import { getUserRoles, hasPermissionByRank, lte } from "@/data/user.types"
import { sessionService } from "@/service/session"
import { userService } from "@/service/user"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { UsersTable } from "./table"
import { SkeletonTable } from "@/components/common/skeleton-table"
import { locationService } from "@/service/location"
import { ModalEditUser } from "@/components/admin/modal-edit-user"
import { ModalToggleUser } from "@/components/admin/modal-toggle-user"
import { ModalResetUserPW } from "@/components/admin/modal-reset-user-pw"
import { ModalResetUserPin } from "@/components/admin/modal-reset-user-pin"

interface Props {
  params: { lng: string }
}
export default async function Page({ params: { lng } }: Props) {
  const { session, user } = await sessionService.validate()

  if (!session) redirect(`${lng}/log-ind`)

  if (!hasPermissionByRank(user.role, 'system_administrator')) {
    redirect(`${lng}/oversigt`)
  }

  const { t } = await serverTranslation(lng, 'sys-bruger')

  return (
    <SiteWrapper
      title={t('page.title')}
      description={t('page.description')}
      actions={
        <>
          <div>inviter</div>
        </>
      }>

      <Suspense fallback={<SkeletonTable />}>
        <UsersTable />
      </Suspense>

      <ModalEditUser />
      <ModalToggleUser />
      <ModalResetUserPW />
      <ModalResetUserPin />
    </SiteWrapper>
  )
}
