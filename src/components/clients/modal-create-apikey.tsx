'use client'

import { createApiKeyAction } from '@/app/[lng]/(site)/sys/kunder/actions'
import { createApiKeyValidation } from '@/app/[lng]/(site)/sys/kunder/validation'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { cn } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { format } from 'date-fns'
import { da } from 'date-fns/locale'
import { CalendarIcon } from 'lucide-react'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { ButtonCopy } from '../common/button-copy'
import { Button } from '../ui/button'
import { Calendar } from '../ui/calendar'
import {
	DialogContentV2,
	DialogFooterV2,
	DialogHeaderV2,
	DialogTitleV2,
	DialogV2,
} from '../ui/dialog-v2'
import { Icons } from '../ui/icons'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'

interface Props {}

export function CreateApiKeyModal({}: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'kunder')
	const [pending, startTransition] = useTransition()
	const [open, setOpen] = useState(false)
	const [apiKey, setApiKey] = useState<string>()
	const { handleSubmit, reset, register, setValue, watch, formState } = useForm<
		z.infer<typeof createApiKeyValidation>
	>({
		resolver: zodResolver(createApiKeyValidation),
		defaultValues: {},
	})

	useCustomEventListener('CreateApiKeyByID', (data: any) => {
		setValue('customerID', data.customerID, {
			shouldDirty: true,
			shouldValidate: true,
		})
		setOpen(true)
	})

	const formValues = watch()

	function onSubmit(values: z.infer<typeof createApiKeyValidation>) {
		setApiKey(undefined)
		startTransition(async () => {
			const res = await createApiKeyAction(values)
			if (res && res.serverError) {
				toast.error(t(siteConfig.errorTitle), {
					description: res.serverError,
				})
				return
			}
			toast.success(t(siteConfig.successTitle), {
				description: t('create-api-key.toast-success'),
			})
			setApiKey(res?.data)
			reset({ customerID: values.customerID })
		})
	}

	function onOpenChange(open: boolean) {
		reset()
		setApiKey(undefined)
		setOpen(open)
	}

	return (
		<DialogV2 open={open} onOpenChange={onOpenChange}>
			<DialogContentV2 className='max-w-sm'>
				<DialogHeaderV2>
					<div className='flex items-center gap-2'>
						<Icons.plus className='size-4 text-primary' />
						<DialogTitleV2>{t('create-api-key.title')}</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className='px-3 space-y-4'
					id='create-form'>
					<p className='text-sm text-muted-foreground'>
						{t('create-api-key.desc')}
					</p>
					{apiKey && (
						<div className='px-3 py-1 rounded-md border border-success'>
							<small className='text-xs text-muted-foreground'>
								{t('create-api-key.apikey')}
							</small>
							<div className='flex items-center gap-2'>
								<p className='text-sm font-mono'>{apiKey}</p>
								<ButtonCopy text={apiKey} />
							</div>
						</div>
					)}
					<div className='grid gap-1.5 w-full'>
						<Label htmlFor='name'>
							{t('create-api-key.name')}
							<RedAsterisk />
						</Label>
						<Input {...register('name')} id='name' type='text' />
					</div>
					<div className='grid gap-1.5 w-full'>
						<Label htmlFor='expiry'>{t('create-api-key.expiry')}</Label>
						<Popover>
							<PopoverTrigger asChild>
								<Button
									variant={'outline'}
									className={cn(
										'justify-start text-left font-normal',
										!formValues.expiry && 'text-muted-foreground',
									)}>
									<CalendarIcon className='mr-2 h-4 w-4' />
									{formValues.expiry ? (
										format(formValues.expiry, 'PPP', { locale: da })
									) : (
										<span>{t('create-api-key.expiry-placeholder')}</span>
									)}
								</Button>
							</PopoverTrigger>
							<PopoverContent className='w-auto p-0'>
								<Calendar
									mode='single'
									selected={formValues.expiry}
									onSelect={date => {
										setValue('expiry', date, {
											shouldDirty: true,
											shouldValidate: true,
										})
									}}
									initialFocus
								/>
							</PopoverContent>
						</Popover>
					</div>
				</form>
				<DialogFooterV2>
					<Button
						onClick={() => onOpenChange(false)}
						size='sm'
						variant='outline'>
						{t('create-api-key.reset')}
					</Button>
					<Button
						disabled={pending || !formState.isValid}
						size='sm'
						form='create-form'
						type='submit'
						className='flex items-center gap-2'>
						{pending && <Icons.spinner className='size-3.5 animate-spin' />}
						{t('create-api-key.confirm')}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}

function RedAsterisk() {
	return <span className='text-destructive'>*</span>
}
