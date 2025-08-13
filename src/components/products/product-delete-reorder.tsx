'use client'

import { deleteReorderAction } from '@/app/[lng]/(site)/varer/produkter/[id]/actions'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { updateChipCount } from '@/lib/utils'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import {
	DialogContentV2,
	DialogFooterV2,
	DialogHeaderV2,
	DialogTitleV2,
	DialogTriggerV2,
	DialogV2,
} from '../ui/dialog-v2'
import { Icons } from '../ui/icons'

export function DeleteRestockModal({ productID }: { productID: number }) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter', {
		keyPrefix: 'details-page.reorder',
	})

	const [pending, startTransition] = useTransition()
	const [open, setOpen] = useState(false)

	function onOpenChange(open: boolean) {
		setOpen(open)
	}

	function deleteFile() {
		startTransition(async () => {
			const res = await deleteReorderAction({ productID })
			if (!res) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: t('delete-toast-error'),
				})
				return
			}
			if (res.serverError || res.validationErrors) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: t('delete-toast-error'),
				})
				return
			}
			onOpenChange(false)
			updateChipCount()
			toast.error(t(`common:${siteConfig.successTitle}`), {
				description: t('delete-toast-success'),
			})
		})
	}

	return (
		<DialogV2 open={open} onOpenChange={onOpenChange}>
			<DialogTriggerV2 asChild>
				<Button
					variant='outline'
					size='sm'
					className='flex items-center gap-2 hover:text-destructive'>
					{t('btn-delete')}
				</Button>
			</DialogTriggerV2>
			<DialogContentV2 className='max-w-md'>
				<DialogHeaderV2>
					<div className='flex items-center gap-2'>
						<Icons.trash className='size-4 text-destructive' />
						<DialogTitleV2 className='text-sm'>
							{t('delete-title')}
						</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<div className='text-sm text-muted-foreground px-3'>
					<p>{t('delete-desc')}</p>
				</div>
				<DialogFooterV2>
					<Button
						onClick={() => onOpenChange(false)}
						size='sm'
						variant='outline'>
						{t('delete-btn-close')}
					</Button>
					<Button
						size='sm'
						form='create-form'
						type='submit'
						className='flex items-center gap-2'
						onClick={() => deleteFile()}
						variant='destructive'>
						{pending && <Icons.spinner className='size-3.5 animate-spin' />}
						{t('delete-btn-confirm')}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}
