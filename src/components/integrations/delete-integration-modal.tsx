'use client'

import { deleteIntegration } from '@/app/[lng]/(site)/administration/firma/actions'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { CustomerIntegration } from '@/lib/database/schema/integrations'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import {
	DialogCloseV2,
	DialogContentV2,
	DialogDescriptionV2,
	DialogFooterV2,
	DialogHeaderV2,
	DialogTitleV2,
	DialogTriggerV2,
	DialogV2,
} from '../ui/dialog-v2'
import { Icons } from '../ui/icons'

interface Props {
	provider: CustomerIntegration
}

export function DeleteIntegrationModal({ provider }: Props) {
	const [pending, startTransition] = useTransition()
	const lang = useLanguage()
	const { t } = useTranslation(lang, 'organisation', {
		keyPrefix: 'integrations.delete-modal',
	})
	const router = useRouter()

	function onDelete() {
		startTransition(async () => {
			const response = await deleteIntegration({ integrationID: provider.id })
			if (response && response.serverError) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: response.serverError,
				})
				return
			}
			toast.success(t(`common:${siteConfig.successTitle}`), {
				description: t('toast-success'),
			})
			router.refresh()
		})
	}

	return (
		<DialogV2>
			<DialogTriggerV2 asChild>
				<Button size='sm' variant='outline' className='hover:text-destructive'>
					{t('trigger')}
				</Button>
			</DialogTriggerV2>
			<DialogContentV2>
				<DialogHeaderV2>
					<DialogTitleV2>
						{t('title', { provider: provider.provider })}
					</DialogTitleV2>
				</DialogHeaderV2>
				<div className='px-3'>
					<DialogDescriptionV2>{t('body')}</DialogDescriptionV2>
				</div>
				<DialogFooterV2>
					<DialogCloseV2 asChild>
						<Button size='sm' variant='outline'>
							{t('close-btn')}
						</Button>
					</DialogCloseV2>
					<Button
						size='sm'
						variant='destructive'
						className='flex items-center gap-2'
						onClick={onDelete}>
						{pending && <Icons.spinner className='animate-spin size-4' />}
						{t('confirm-btn')}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}
