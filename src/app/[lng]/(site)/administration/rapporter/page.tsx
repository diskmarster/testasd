import { serverTranslation } from '@/app/i18n'
import { ModalInventoryReport } from '@/components/admin/modal-inventory-report'
import { ModalSumReport } from '@/components/admin/modal-sum-report'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { Label } from '@/components/ui/label'
import { PropsWithChildren } from 'react'

interface PageProps extends WithAuthProps {
	params: { lng: string }
}

async function Page({ params: { lng } }: PageProps) {
	const { t } = await serverTranslation(lng, 'rapporter')

	return (
		<SiteWrapper
			title={t('title')}
			description={t('description')}>
			<ReportCardWrapper
				title={t("inventory-report-modal.card-label")}
				description={t("inventory-report-modal.card-desc")}>
				<ModalInventoryReport />
			</ReportCardWrapper>
			<ReportCardWrapper
				title={t("inventory-sum-report.card-label")}
				description={t("inventory-sum-report.card-desc")}>
				<ModalSumReport />
			</ReportCardWrapper>
		</SiteWrapper>
	)
}

function ReportCardWrapper({
	title,
	description,
	children,
}: PropsWithChildren<{
	title: string,
	description: string,
}>) {
	return (
		<div className='md:max-w-lg'>
			<div className='flex items-center justify-between rounded-md border p-4 shadow-sm bg-background'>
				<div className='grid gap-0.5'>
					<Label>{title}</Label>
					<p className='text-sm text-muted-foreground'>{description}</p>
				</div>
				{children}
			</div>
		</div>
	)
}

export default withAuth(Page, undefined, 'moderator')
