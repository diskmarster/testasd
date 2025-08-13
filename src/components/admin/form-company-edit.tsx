'use client'

import { updateCustomerAction } from '@/app/[lng]/(site)/administration/organisation/actions'
import { updateCustomerValidation } from '@/app/[lng]/(site)/administration/organisation/validation'
import { useTranslation } from '@/app/i18n/client'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { Customer } from '@/lib/database/schema/customer'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from '../ui/card'
import { Separator } from '../ui/separator'
import {
	Setting,
	SettingBody,
	SettingContent,
	SettingDescription,
	SettingFooter,
	SettingLabel,
	SettingSkeleton,
	SettingTitle,
} from '../ui/settings'
import { Skeleton } from '../ui/skeleton'

interface Props {
	customer: Customer
}

export function FormCompanyEdit({ customer }: Props) {
	const context = 'details'

	const lng = useLanguage()
	const { t } = useTranslation(lng, 'organisation')
	const [pending, startTransition] = useTransition()
	const [formError, setFormError] = useState<string | null>(null)
	const { t: validationT } = useTranslation(lng, 'validation')
	const schema = updateCustomerValidation(validationT)

	const { handleSubmit, formState, register, reset } = useForm<
		z.infer<typeof schema>
	>({
		resolver: zodResolver(schema),
		defaultValues: {
			company: customer.company,
			email: customer.email,
		},
	})

	return (
		<Card className='flex flex-col'>
			<CardHeader>
				<CardTitle>{t('company-page.title', { context })}</CardTitle>
				<CardDescription>
					{t('company-page.description', { context })}
				</CardDescription>
			</CardHeader>
			<CardContent className='flex-1'>
				<form
					id='company-details-form'
					className={cn('grid w-full items-start gap-4')}
					onSubmit={handleSubmit(values => {
						startTransition(async () => {
							const res = await updateCustomerAction({ ...values })
							if (res && res.serverError) {
								setFormError(res.serverError)
								return
							} else if (res && res.data == true) {
								reset(values)
							}
							toast(t(siteConfig.successTitle), {
								description: t('company-page.update-success', { context }),
							})
						})
					})}>
					{formError && (
						<Alert variant='destructive'>
							<Icons.alert className='size-4 !top-3' />
							<AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
							<AlertDescription>{formError}</AlertDescription>
						</Alert>
					)}
					<div className='flex flex-col w-full'>
						<Setting>
							<SettingBody>
								<SettingLabel className='pt-0'>
									<SettingTitle htmlFor='name'>
										{t('company-page.form-company-edit.company-name')}
									</SettingTitle>
									<SettingDescription>
										{t('company-page.form-company-edit.company-description')}
									</SettingDescription>
								</SettingLabel>
								<SettingContent className='pt-0 max-w-[250px]'>
									<Input id='name' type='text' {...register('company')} />
								</SettingContent>
							</SettingBody>
							{formState.errors.company && (
								<SettingFooter>
									<p className='text-sm text-destructive '>
										{formState.errors.company.message}
									</p>
								</SettingFooter>
							)}
						</Setting>
						<Separator />
						<Setting>
							<SettingBody>
								<SettingLabel>
									<SettingTitle htmlFor='email'>
										{t('company-page.form-company-edit.email')}
									</SettingTitle>
									<SettingDescription>
										{t('company-page.form-company-edit.email-description')}
									</SettingDescription>
								</SettingLabel>
								<SettingContent className='max-w-[250px]'>
									<Input id='email' type='email' {...register('email')} />
								</SettingContent>
							</SettingBody>
							{formState.errors.email && (
								<SettingFooter>
									<p className='text-sm text-destructive '>
										{formState.errors.email.message}
									</p>
								</SettingFooter>
							)}
						</Setting>
					</div>
				</form>
			</CardContent>
			<CardFooter>
				<Button
					form='company-details-form'
					disabled={!formState.isDirty}
					type='submit'
					className='flex items-center gap-2 md:w-fit'>
					{pending && <Icons.spinner className='size-4 animate-spin' />}
					{t('company-page.update-button', { context })}
				</Button>
			</CardFooter>
		</Card>
	)
}

export function CompanyEditSkeleton() {
	return (
		<Card className='flex flex-col'>
			<CardHeader>
				<Skeleton className='w-1/3 h-6' />
				<Skeleton className='w-2/3 h-4' />
			</CardHeader>
			<CardContent className='flex-1'>
				<div className='grid w-full items-start gap-2'>
					<div className='flex flex-col w-full'>
						<SettingSkeleton />
						<Separator />
						<SettingSkeleton />
					</div>
				</div>
			</CardContent>
			<CardFooter>
				<Skeleton className='h-10 w-40' />
			</CardFooter>
		</Card>
	)
}
