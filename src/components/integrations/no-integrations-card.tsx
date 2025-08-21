'use client'

import { createEconomicIntegration } from '@/app/[lng]/(site)/administration/firma/actions'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { providerLogoMap } from '@/data/integrations.types'
import {
	SyncProviderConfig,
	SyncProviderType,
} from '@/lib/integrations/sync/interfaces'
import { tryCatch } from '@/lib/utils.server'
import { useRouter } from 'next/navigation'
import { Dispatch, SetStateAction, useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import { Input } from '../ui/input'
import { Label } from '../ui/label'

interface Props {
	appInstallUrl: string
}

export function NoIntegrationsCard({ appInstallUrl }: Props) {
	const lang = useLanguage()
	const { t } = useTranslation(lang, 'organisation', {
		keyPrefix: 'integrations',
	})
	const [installer, setInstaller] = useState<SyncProviderType>()

	return (
		<div>
			<div className='space-y-1.5 mb-2'>
				<h2 className='text-base font-medium'>{t('card-title')}</h2>
				<p className='text-sm text-muted-foreground'>{t('card-desc')}</p>
			</div>
			<div>
				{!installer ? (
					<ChooseInstaller setInstaller={setInstaller} />
				) : (
					<EconomicInstaller
						setInstaller={setInstaller}
						appInstallUrl={appInstallUrl}
					/>
				)}
			</div>
		</div>
	)
}

function ChooseInstaller({
	setInstaller,
}: {
	setInstaller: Dispatch<SetStateAction<SyncProviderType | undefined>>
}) {
	const lang = useLanguage()
	const { t } = useTranslation(lang, 'organisation', {
		keyPrefix: 'integrations',
	})
	const providers: { name: SyncProviderType; desc: string; img: string }[] = [
		{
			name: 'e-conomic',
			desc: t('e-conomic.description'),
			img: providerLogoMap['e-conomic'],
		},
	]

	return (
		<div className='flex flex-col gap-4'>
			<div className='flex flex-col gap-4'>
				<p className='max-w-prose text-pretty text-sm space-y-1'>
					{t('before-install-sub-1')}
				</p>
				<p className='max-w-prose text-pretty text-sm space-y-1'>
					{t('before-install-sub-2')}
				</p>
			</div>
			<ul className='flex gap-2'>
				{providers.map((p, i) => (
					<li key={i}>
						<div className='border shadow-sm bg-background min-w-80 p-4 flex items-center gap-4 rounded-md'>
							<div className='space-y-1.5'>
								<img src={p.img} alt='logo' className='h-6 w-auto' />
								<p className='text-xs text-muted-foreground'>{p.desc}</p>
							</div>
							<Button size='sm' onClick={() => setInstaller(p.name)}>
								{t('install-btn')}
							</Button>
						</div>
					</li>
				))}
			</ul>
		</div>
	)
}

function EconomicInstaller({
	setInstaller,
	appInstallUrl,
}: {
	appInstallUrl: string
	setInstaller: Dispatch<SetStateAction<SyncProviderType | undefined>>
}) {
	const lang = useLanguage()
	const { t } = useTranslation(lang, 'organisation', {
		keyPrefix: 'integrations',
	})

	const [pending, startTransition] = useTransition()
	const [agreementGrantToken, setAgreementGrantToken] = useState<string>('')
	const hasValue = (agreementGrantToken?.length || 0) > 0
	const router = useRouter()

	async function pasteFromClipboard<T>(setter: Dispatch<SetStateAction<T>>) {
		const readAttempt = await tryCatch(navigator.clipboard.readText())
		if (!readAttempt.success) {
			toast.error(t(`common:${siteConfig.errorTitle}`), {
				description: t('nothing-in-clipboard'),
			})
			return
		}
		setter(readAttempt.data as T)
	}

	function onSubmit(values: SyncProviderConfig['e-conomic']) {
		startTransition(async () => {
			const response = await createEconomicIntegration({
				config: { agreementGrantToken: values.agreementGrantToken },
			})
			if (response && response.serverError) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: response.serverError,
				})
				return
			}
			toast.success(t(`common:${siteConfig.successTitle}`), {
				description: t('integration-installed', { provider: 'e-conomic' }),
			})
			setAgreementGrantToken('')
			router.refresh()
		})
	}

	return (
		<div className='flex flex-col items-start gap-4'>
			<Button
				size='sm'
				variant='ghost'
				className='flex items-center gap-2'
				onClick={() => setInstaller(undefined)}>
				<Icons.arrowLeft className='size-4' />
				{t('go-back-btn')}
			</Button>

			<p className='text-sm text-muted-foreground max-w-prose'>
				{t('e-conomic.sub-1')}
			</p>

			<p className='text-sm text-muted-foreground max-w-prose'>
				{t('e-conomic.sub-2-part-1')}{' '}
				<a
					className='font-medium underline'
					href={appInstallUrl}
					target='_blank'>
					{t('e-conomic.sub-2-link')}
				</a>{' '}
				{t('e-conomic.sub-2-part-2')}
			</p>

			<p className='text-sm text-muted-foreground max-w-prose'>
				{t('e-conomic.sub-3')}
			</p>

			<div className='grid gap-2'>
				<Label>{t('e-conomic.id-label')}</Label>
				<div className='flex items-center gap-2'>
					<Input
						value={agreementGrantToken}
						onChange={e => setAgreementGrantToken(e.target.value)}
						className='w-[25rem]'
						placeholder={t('e-conomic.id-placeholder')}
					/>
					{!hasValue ? (
						<Button
							variant='outline'
							onClick={() => pasteFromClipboard(setAgreementGrantToken)}>
							{t('e-conomic.paste-btn')}
						</Button>
					) : (
						<Button
							className='flex items-center gap-2'
							onClick={() => onSubmit({ agreementGrantToken })}>
							{pending && <Icons.spinner className='animate-spin size-4' />}
							{t('e-conomic.save-btn')}
						</Button>
					)}
				</div>
			</div>
		</div>
	)
}
