'use client'

import { createClientAction } from '@/app/[lng]/(site)/sys/kunder/actions'
import { createClientValidation } from '@/app/[lng]/(site)/sys/kunder/validation'
import { useTranslation } from '@/app/i18n/client'
import { Button } from '@/components/ui/button'
import {
	Credenza,
	CredenzaBody,
	CredenzaContent,
	CredenzaDescription,
	CredenzaHeader,
	CredenzaTitle,
	CredenzaTrigger,
} from '@/components/ui/credenza'
import { Icons } from '@/components/ui/icons'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { plansConfig } from '@/config/plan'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { cn, numberToCurrency } from '@/lib/utils'
import { planUserLimits } from '@/service/customer.utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'

interface Props {}

export function ModalCreateClient({}: Props) {
	const [open, setOpen] = useState(false)
	const [pending, startTransition] = useTransition()
	const [error, setError] = useState<string>()

	const lng = useLanguage()
	const { t } = useTranslation(lng, 'kunder')

	const schema = createClientValidation(t)

	const { handleSubmit, register, formState, reset, watch, setValue } = useForm<
		z.infer<typeof schema>
	>({
		resolver: zodResolver(schema),
		defaultValues: {
			plan: 'pro',
			extraUsers: 0,
		},
	})

	const formValues = watch()

	function onOpenChange(open: boolean) {
		reset()
		setOpen(open)
	}

	const onSubmit = async (values: z.infer<typeof schema>) => {
		startTransition(async () => {
			const res = await createClientAction(values)
			if (res && res.serverError) {
				setError(res.serverError)
				return
			}
			setError(undefined)
			reset()
			setOpen(false)
			toast.success(t(siteConfig.successTitle), {
				description: t('create-modal.toast-success', {
					client: values.company,
				}),
			})
		})
	}

	function increment() {
		const nextValue = parseFloat(formValues.extraUsers.toString()) + 1
		setValue('extraUsers', nextValue, { shouldValidate: true })
	}

	function decrement() {
		const nextValue = Math.max(
			0,
			parseFloat(formValues.extraUsers.toString()) - 1,
		)
		setValue('extraUsers', nextValue, { shouldValidate: true })
	}

	return (
		<Credenza open={open} onOpenChange={onOpenChange}>
			<CredenzaTrigger asChild>
				<Button
					size='icon'
					variant='outline'
					tooltip={t('create-modal.tooltip')}>
					<Icons.plus className='size-4' />
				</Button>
			</CredenzaTrigger>
			<CredenzaContent className='md:max-w-md'>
				<CredenzaHeader>
					<CredenzaTitle>{t('create-modal.title')}</CredenzaTitle>
					<CredenzaDescription>
						{t('create-modal.description')}
					</CredenzaDescription>
				</CredenzaHeader>
				<CredenzaBody>
					<form
						className='grid w-full items-start gap-4'
						onSubmit={handleSubmit(onSubmit)}>
						{error && (
							<Alert variant='destructive'>
								<Icons.alert className='!top-3 size-4' />
								<AlertTitle>{t(siteConfig.errorTitle)}</AlertTitle>
								<AlertDescription>{error}</AlertDescription>
							</Alert>
						)}
						<div className='grid gap-2'>
							<Label htmlFor='company'>{t('create-modal.company-label')}</Label>
							<Input
								id='company'
								type='text'
								placeholder={t('create-modal.company-placeholder')}
								{...register('company')}
							/>
							{formState.errors.company && (
								<p className='text-sm text-destructive'>
									{formState.errors.company.message}
								</p>
							)}
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='email'>{t('create-modal.email-label')}</Label>
							<Input
								id='email'
								type='email'
								placeholder={t('create-modal.email-placeholder')}
								{...register('email')}
							/>
							{formState.errors.email && (
								<p className='text-sm text-destructive'>
									{formState.errors.email.message}
								</p>
							)}
							<p className='text-sm text-muted-foreground'>
								{t('create-modal.email-description')}
							</p>
						</div>
						<div className='grid gap-2'>
							<Label htmlFor='plan'>{t('create-modal.plan-label')}</Label>
							<div className='grid grid-cols-3 h-16 gap-2'>
								{plansConfig.map((p, i) => (
									<div
										key={i}
										onClick={() => {
											setValue('plan', p.plan, { shouldValidate: true })
										}}
										className={cn(
											'border rounded-md flex gap-0.5 flex-col items-center justify-center hover:border-primary/50 cursor-pointer transition-colors',
											formValues.plan == p.plan && 'border-2 border-primary',
										)}>
										<span className='capitalize font-medium'>{p.plan}</span>
										<span className='text-xs text-muted-foreground'>
											{numberToCurrency(p.price, lng)}
										</span>
									</div>
								))}
							</div>
						</div>
						<div className='grid gap-2'>
							<div className='flex justify-between'>
								<Label htmlFor='extraUsers'>
									{t('create-modal.extra-users-label')}
								</Label>
								<p className='text-xs text-muted-foreground'>
									{t('create-modal.extra-users-price')}
								</p>
							</div>
							<div>
								<div className='flex'>
									<Button
										tabIndex={-1}
										size='icon'
										type='button'
										variant='outline'
										className='h-14 w-1/4 border-r-0 rounded-r-none rounded-bl-none'
										onClick={decrement}>
										<Icons.minus className='size-6' />
									</Button>
									<Input
										type='number'
										step={1}
										{...register('extraUsers')}
										onChange={e => {
											const value = parseInt(e.target.value, 10) || 0
											setValue('extraUsers', value, { shouldValidate: true })
										}}
										className={cn(
											'w-1/2 h-14 rounded-none text-center text-2xl z-10 shadow-none',
											'[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
										)}
									/>
									<Button
										tabIndex={-1}
										size='icon'
										type='button'
										variant='outline'
										className='h-14 w-1/4 border-l-0 rounded-l-none rounded-br-none'
										onClick={increment}>
										<Icons.plus className='size-6' />
									</Button>
								</div>
								<div className='flex'>
									<Button
										tabIndex={-1}
										size='icon'
										type='button'
										variant='outline'
										className={cn(
											'h-10 w-1/4 rounded-tl-none rounded-r-none border-t-0 border-r-0',
											formValues.extraUsers &&
												formValues.plan &&
												'rounded-l-none shadow-none',
										)}
										onClick={() =>
											setValue('extraUsers', 5, { shouldValidate: true })
										}>
										5
									</Button>
									<Button
										tabIndex={-1}
										size='icon'
										type='button'
										variant='outline'
										className={cn(
											'h-10 w-1/4 rounded-none border-t-0',
											formValues.extraUsers && formValues.plan && 'shadow-none',
										)}
										onClick={() =>
											setValue('extraUsers', 10, { shouldValidate: true })
										}>
										10
									</Button>
									<Button
										tabIndex={-1}
										size='icon'
										type='button'
										variant='outline'
										className={cn(
											'h-10 w-1/4 rounded-none border-t-0 border-l-0',
											formValues.extraUsers && formValues.plan && 'shadow-none',
										)}
										onClick={() =>
											setValue('extraUsers', 15, { shouldValidate: true })
										}>
										15
									</Button>
									<Button
										tabIndex={-1}
										size='icon'
										type='button'
										variant='outline'
										className={cn(
											'h-10 w-1/4 border-t-0 border-l-0 rounded-l-none rounded-tr-none',
											formValues.extraUsers &&
												formValues.plan &&
												'rounded-r-none shadow-none',
										)}
										onClick={() =>
											setValue('extraUsers', 20, { shouldValidate: true })
										}>
										20
									</Button>
								</div>
								<div
									className={cn(
										'bg-border rounded-b-md text-sm h-0 transition-all text-muted-foreground flex items-center gap-2 justify-center',
										formValues.extraUsers &&
											formValues.plan &&
											'shadow-sm h-12 md:h-9',
									)}>
									{formValues.extraUsers != 0 && formValues.plan && (
										<p className='text-center'>
											{t('create-modal.extra-users-count', {
												count:
													Number(formValues.extraUsers) +
													Number(planUserLimits[formValues.plan]),
											})}
										</p>
									)}
								</div>
							</div>
							{formState.errors.extraUsers && (
								<p className='text-sm text-destructive'>
									{formState.errors.extraUsers.message}
								</p>
							)}
						</div>
						<Button
							type='submit'
							disabled={pending || !formState.isValid}
							className='flex items-center gap-2'>
							{pending && <Icons.spinner className='size-4 animate-spin' />}
							{t('create-modal.submit-button')}
						</Button>
					</form>
				</CredenzaBody>
			</CredenzaContent>
		</Credenza>
	)
}
