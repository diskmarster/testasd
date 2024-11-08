import { serverTranslation } from "@/app/i18n"
import { SiteWrapper } from "@/components/common/site-wrapper"
import { SkeletonTable } from "@/components/common/skeleton-table"
import { hasPermissionByRank } from "@/data/user.types"
import { sessionService } from "@/service/session"
import { redirect } from "next/navigation"
import { Suspense } from "react"
import { ClientTable } from "./table"

interface Props {
  params: { lng: string }
}

export default async function Page({ params: { lng } }: Props) {
  const { session, user } = await sessionService.validate()

  if (!session) redirect('/login')

  if (!hasPermissionByRank(user.role, 'system_administrator')) {
    redirect("/oversigt")
  }

  const { t } = await serverTranslation(lng, 'kunder')

  return (
    <SiteWrapper
      title={t('page.title')}
      description={t('page.description')}
      actions={
        <>
          <span>opret</span>
        </>
      }>
      <Suspense fallback={<SkeletonTable />}>
        <ClientTable />
      </Suspense>
    </SiteWrapper>
  )
}

