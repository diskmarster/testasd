import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { serverTranslation } from '@/app/i18n'
import { ModalInventoryReport } from '@/components/admin/modal-inventory-report'
import { ModalSumReport } from '@/components/admin/modal-sum-report'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { Label } from '@/components/ui/label'
import { hasPermissionByRank } from '@/data/user.types'
import { customerService } from '@/service/customer'
import { locationService } from '@/service/location'
import { sessionService } from '@/service/session'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'

interface PageProps {
	params: { lng: string }
}

export default async function Page({ params: { lng } }: PageProps) {
	const { t } = await serverTranslation(lng, 'rapporter')
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

	return (
		<SiteWrapper
			title={t('title')}
			description={t('description')}>
			<ReportCardWrapper
				title={t("inventory-report-modal.card-label")}
				description={t("inventory-report-modal.card-desc")}
				action={<ModalInventoryReport />}
			/>
			<ReportCardWrapper
				title={t("inventory-sum-report.card-label")}
				description={t("inventory-sum-report.card-desc")}
				action={<ModalSumReport />}
			/>
		</SiteWrapper>
	)
}

function ReportCardWrapper({
	title,
	description,
	action,
}: {
	title: string,
	description: string,
	action: ReactNode,
}) {
	return (
		<div className='md:max-w-lg'>
			<div className='flex items-center justify-between rounded-md border p-4 shadow-sm bg-background'>
				<div className='grid gap-0.5'>
					<Label>{title}</Label>
					<p className='text-sm text-muted-foreground'>{description}</p>
				</div>
				{action}
			</div>
		</div>
	)
}
