'use client'

import { updatePasswordAction } from '@/app/[lng]/(site)/profil/actions'
import { updatePasswordValidation } from '@/app/[lng]/(site)/profil/validation'
import { useTranslation } from '@/app/i18n/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import {
	Credenza,
	CredenzaBody,
	CredenzaClose,
	CredenzaContent,
	CredenzaDescription,
	CredenzaFooter,
	CredenzaHeader,
	CredenzaTitle,
	CredenzaTrigger,
} from '@/components/ui/credenza'
import { Icons } from '@/components/ui/icons'
import { Label } from '@/components/ui/label'
import { PasswordInput } from '@/components/ui/password-input'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { useSession } from '@/context/session'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'

export function ProfilePassword() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'profil')
	return (
		<div className='flex flex-row items-center justify-between rounded-md border p-4 md:max-w-lg'>
			<div className='grid gap-0.5'>
				<Label>{t('profile-password.new-password')}</Label>
				<p className='text-sm text-muted-foreground'>
					{t('profile-password.update-button')}
				</p>
			</div>
			<PasswordDialog />
		</div>
	)
}

function PasswordDialog() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'profil')
	const { session } = useSession()
	const [pending, startTransition] = useTransition()
	const [formError, setFormError] = useState<string | null>(null)
	const [open, setOpen] = useState<boolean>(false)
	const { t: validationT } = useTranslation(lng, 'validation')
	const schema = updatePasswordValidation(validationT)

	const { handleSubmit, formState, register, reset } = useForm<
		z.infer<typeof schema>
	>({
		resolver: zodResolver(schema),
	})

	if (!session) return null
	return (
		<Credenza open={open} onOpenChange={setOpen}>
			<CredenzaTrigger asChild>
				<Button variant='outline' className='hover:text-destructive'>
					{t('profile-password-dialog.title')}
				</Button>
			</CredenzaTrigger>
			<CredenzaContent>
				<form className='space-y-4'>
					<CredenzaHeader>
						<CredenzaTitle>
							{t('profile-password-dialog.new-password')}
						</CredenzaTitle>
						<CredenzaDescription>
							{t('profile-password-dialog.description')}
						</CredenzaDescription>
					</CredenzaHeader>
					<CredenzaBody>
						<div className={cn('grid w-full items-start gap-4 md:max-w-lg')}>
							{formError && (
								<Alert variant='destructive'>
									<Icons.alert className='size-4 !top-3' />
									<AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
									<AlertDescription>{formError}</AlertDescription>
								</Alert>
							)}
							<div className='grid gap-2'>
								<Label htmlFor='currentPassword'>
									{t('profile-password-dialog.current-password')}
								</Label>
								<PasswordInput
									id='currentPassword'
									{...register('currentPassword')}
								/>
								{formState.errors.currentPassword && (
									<p className='text-sm text-destructive '>
										{formState.errors.currentPassword.message}
									</p>
								)}
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='newPassword'>
									{t('profile-password-dialog.new-password')}
								</Label>
								<PasswordInput id='newPassword' {...register('newPassword')} />
								{formState.errors.newPassword && (
									<p className='text-sm text-destructive '>
										{formState.errors.newPassword.message}
									</p>
								)}
							</div>
							<div className='grid gap-2'>
								<Label htmlFor='confirmPassword'>
									{t('profile-password-dialog.confirm-password')}
								</Label>
								<PasswordInput
									id='confirmPassword'
									{...register('confirmPassword')}
								/>
								{formState.errors.confirmPassword && (
									<p className='text-sm text-destructive '>
										{formState.errors.confirmPassword.message}
									</p>
								)}
							</div>
						</div>
					</CredenzaBody>
					<CredenzaFooter>
						<CredenzaClose asChild>
							<Button variant='link'>
								{t('profile-password-dialog.cancel-button')}
							</Button>
						</CredenzaClose>
						<Button
							disabled={!formState.isDirty}
							type='submit'
							className='flex items-center gap-2'
							onClick={handleSubmit(values => {
								startTransition(async () => {
									reset()
									const res = await updatePasswordAction({ ...values })
									if (res && res.serverError) {
										setFormError(res.serverError)
										return
									}
									toast(t(`common:${siteConfig.successTitle}`), {
										description: t('profile-password.password-updated'),
									})
									setOpen(false)
								})
							})}>
							{pending && <Icons.spinner className='size-4 animate-spin' />}
							{t('profile-password-dialog.update-button')}
						</Button>
					</CredenzaFooter>
				</form>
			</CredenzaContent>
		</Credenza>
	)
}
