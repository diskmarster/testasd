'use client'

import { toggleClientAction } from '@/app/[lng]/(site)/sys/kunder/actions'
import { toggleClientStatusValidation } from '@/app/[lng]/(site)/sys/kunder/validation'
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

export function ModalToggleClient() {
	const [open, setOpen] = useState(false)
	const [error, setError] = useState<string>()
	const [pending, startTransition] = useTransition()
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'kunder')

	const { setValue, handleSubmit, formState, watch, reset } = useForm<
		z.infer<typeof toggleClientStatusValidation>
	>({
		resolver: zodResolver(toggleClientStatusValidation),
	})

	const formValues = watch()
	const action =
		formValues.isActive != undefined
			? formValues.isActive == true
				? 'deactivate'
				: 'activate'
			: undefined

	useCustomEventListener('ToggleClientByID', (data: any) => {
		setOpen(true)
		setValue('customerID', data.customerID, { shouldValidate: true })
		setValue('isActive', data.isActive, { shouldValidate: true })
	})

	function onSubmit(values: z.infer<typeof toggleClientStatusValidation>) {
		startTransition(async () => {
			const res = await toggleClientAction(values)

			if (res && res.serverError) {
				setError(res.serverError)
				return
			}

			setError(undefined)
			setOpen(false)
			toast.success(t(siteConfig.successTitle), {
				description: t('toggle-modal.toast-success', { context: action }),
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
					<CredenzaTitle>
						{t('toggle-modal.title', { context: action })}
					</CredenzaTitle>
					<CredenzaDescription>
						{t('toggle-modal.description')}
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
									{t('toggle-modal.cancel-button')}
								</Button>
							</CredenzaClose>
							<Button
								disabled={
									!formState.isValid || pending || formState.isSubmitting
								}
								variant={formValues.isActive ? 'destructive' : 'default'}
								size='lg'
								className='w-full gap-2'>
								{pending && <Icons.spinner className='size-4 animate-spin' />}
								{t('toggle-modal.submit-button', { context: action })}
							</Button>
						</div>
					</form>
				</CredenzaBody>
			</CredenzaContent>
		</Credenza>
	)
}
