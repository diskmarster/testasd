'use client'

import { deleteClientAction } from '@/app/[lng]/(site)/sys/kunder/actions'
import { deleteClientStatusValidation } from '@/app/[lng]/(site)/sys/kunder/validation'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Button } from '../ui/button'
import {
	Credenza,
	CredenzaBody,
	CredenzaClose,
	CredenzaContent,
	CredenzaDescription,
	CredenzaHeader,
	CredenzaTitle,
} from '../ui/credenza'
import { Icons } from '../ui/icons'

export function ModalDeleteClient() {
	const [open, setOpen] = useState(false)
	const [error, setError] = useState<string>()
	const [pending, startTransition] = useTransition()
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'kunder')

	const { setValue, handleSubmit, formState, watch, reset } = useForm<
		z.infer<typeof deleteClientStatusValidation>
	>({
		resolver: zodResolver(deleteClientStatusValidation),
	})

	useCustomEventListener('DeleteClientByID', (data: any) => {
		setOpen(true)
		setValue('customerID', data.customerID, { shouldValidate: true })
	})

	function onSubmit(values: z.infer<typeof deleteClientStatusValidation>) {
		startTransition(async () => {
			const res = await deleteClientAction(values)

			if (res && res.serverError) {
				setError(res.serverError)
				return
			}

			setError(undefined)
			setOpen(false)
			toast.success(t(siteConfig.successTitle), {
				description: t('delete-modal.toast-success'),
			})
		})
	}

	function onOpenChange(open: boolean) {
		reset()
		setOpen(open)
	}

	return (
		<Credenza open={open} onOpenChange={onOpenChange}>
			<CredenzaContent className='md:max-w-sm'>
				<CredenzaHeader>
					<CredenzaTitle>{t('delete-modal.title')}</CredenzaTitle>
					<CredenzaDescription>
						{t('delete-modal.description')}
					</CredenzaDescription>
				</CredenzaHeader>
				<CredenzaBody>
					<form
						onSubmit={handleSubmit(onSubmit)}
						className='space-y-4 pb-4 md:pb-0'>
						{error && (
							<Alert variant='destructive'>
								<Icons.alert className='size-4 !top-3' />
								<AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<div className='flex flex-col gap-2 md:flex-row md:justify-end'>
							<CredenzaClose asChild>
								<Button
									type='button'
									size='lg'
									variant='secondary'
									className='w-full'>
									{t('delete-modal.cancel-button')}
								</Button>
							</CredenzaClose>
							<Button
								disabled={
									!formState.isValid || pending || formState.isSubmitting
								}
								variant='destructive'
								size='lg'
								className='w-full gap-2'>
								{pending && <Icons.spinner className='size-4 animate-spin' />}
								{t('delete-modal.submit-button')}
							</Button>
						</div>
					</form>
				</CredenzaBody>
			</CredenzaContent>
		</Credenza>
	)
}
