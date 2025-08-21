'use client'

import {
	syncProductCatalogueAction,
	updateIntegrationSettings,
} from '@/app/[lng]/(site)/administration/firma/actions'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { providerLogoMap } from '@/data/integrations.types'
import {
	CustomerIntegration,
	CustomerIntegrationSettings,
} from '@/lib/database/schema/integrations'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '../ui/alert-dialog'
import { Switch } from '../ui/switch'
import { DeleteIntegrationModal } from './delete-integration-modal'

interface Props {
	integrationSettings: CustomerIntegrationSettings
	providers: CustomerIntegration[]
}

export function IntegrationsCard({ providers, integrationSettings }: Props) {
	const lang = useLanguage()
	const { t } = useTranslation(lang, 'organisation', {
		keyPrefix: 'integrations',
	})
	const [pending, startTransition] = useTransition()
	const router = useRouter()

	const [enableSyncDialogOpen, setEnableSyncDialogOpen] = useState(false)

	function toggleIntegrationSetting(
		settings: Pick<
			CustomerIntegrationSettings,
			'useSyncProducts' | 'integrationID'
		>,
	) {
		startTransition(async () => {
			const actionPromise = updateIntegrationSettings({
				useSyncProducts: settings.useSyncProducts,
			})

			toast.promise(actionPromise, {
				loading: t('updating-settings-loading'),
				success: t('updating-settings-success'),
				error: t('updating-settings-error'),
			})

			const response = await actionPromise
			if (response && response.serverError) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: response.serverError,
				})
				return
			}
			router.refresh()

			const syncActionPromise = syncProductCatalogueAction({
				integrationID: settings.integrationID,
			})
			toast.promise(
				syncActionPromise.then(data => {
					if (data?.serverError) throw new Error(data.serverError)
					else return data
				}),
				{
					loading: t('syncing-catalogue-loading'),
					success: t('syncing-catalogue-success'),
					error: t('syncing-catalogue-error'),
				},
			)
			const syncResponse = await syncActionPromise
			if (syncResponse && syncResponse.serverError) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: syncResponse.serverError,
				})
			}
		})
	}

	return (
		<div className='max-w-4xl'>
			<div className='mb-2'>
				<h2 className='text-base font-medium'>{t('card-title')}</h2>
				<p className='text-sm text-muted-foreground'>{t('card-desc')}</p>
			</div>
			<div>
				<div className='flex flex-col gap-4'>
					<div className='space-y-2'>
						<div>
							<p className='text-sm font-medium'>{t('providers-title')}</p>
							<p className='text-sm text-muted-foreground'>
								{t('providers-desc')}
							</p>
						</div>
						<div>
							{providers.map(p => (
								<div
									key={p.id}
									className='flex flex-row items-center justify-between rounded-lg border px-3 py-3.5 shadow-sm'>
									<img
										className='h-6 w-auto'
										src={providerLogoMap[p.provider]}
										alt={`${p.provider} logo`}
									/>
									<DeleteIntegrationModal provider={p} />
								</div>
							))}
						</div>
					</div>

					<div className='space-y-2'>
						<div>
							<p className='text-sm font-medium'>{t('integrations-title')}</p>
							<p className='text-sm text-muted-foreground'>
								{t('integrations-desc')}
							</p>
						</div>
						<SwitchSection
							title={t('integrations.sync-products-title')}
							sub={t('integrations.sync-products-desc')}
							checked={integrationSettings.useSyncProducts}
							disabled={integrationSettings.useSyncProducts}
							onCheckedChange={(checked: boolean) => {
								setEnableSyncDialogOpen(checked)
							}}
							isLoading={pending}
						/>
					</div>
				</div>
			</div>
			<EnableIntegrationSync
				open={enableSyncDialogOpen}
				onOpenChange={setEnableSyncDialogOpen}
				title={t('enable-sync-dialog.title')}
				description={t('enable-sync-dialog.description')}
				dismissText={t('enable-sync-dialog.dismiss-btn')}
				acceptText={t('enable-sync-dialog.accept-btn')}
				onDismiss={() => setEnableSyncDialogOpen(false)}
				onAccept={() =>
					toggleIntegrationSetting({
						useSyncProducts: true,
						integrationID: integrationSettings.integrationID,
					})
				}
			/>
		</div>
	)
}

function SwitchSection({
	title,
	sub,
	checked,
	disabled,
	onCheckedChange,
	isLoading,
}: {
	title: string
	sub: string
	checked?: boolean
	disabled?: boolean
	onCheckedChange: (checked: boolean) => void
	isLoading: boolean
}) {
	return (
		<div>
			<div className='flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm'>
				<div className='space-y-0.5'>
					<p className='text-sm font-medium leading-none'>{title}</p>
					<p className='text-sm text-muted-foreground'>{sub}</p>
				</div>
				<Switch
					checked={checked}
					disabled={disabled}
					onCheckedChange={onCheckedChange}
					isLoading={isLoading}
				/>
			</div>
		</div>
	)
}

function EnableIntegrationSync({
	open,
	onOpenChange,
	title,
	description,
	acceptText,
	dismissText,
	onAccept,
	onDismiss,
}: {
	open: boolean
	onOpenChange: (v: boolean) => void
	title: string
	description: string
	acceptText: string
	dismissText: string
	onAccept: () => void
	onDismiss: () => void
}) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel onClick={onDismiss}>
						{dismissText}
					</AlertDialogCancel>
					<AlertDialogAction onClick={onAccept}>{acceptText}</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
