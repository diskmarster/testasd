'use client'

import { createSupplierAction } from '@/app/[lng]/(site)/administration/leverandorer/actions'
import { createSupplierValidation } from '@/app/[lng]/(site)/administration/leverandorer/validation'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { supplierContries, SupplierContry } from '@/data/suppliers.types'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import ReactCountryFlag from 'react-country-flag'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
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
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'

interface Props {}

export function CreateSupplierModal({}: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'leverandører')
	const [pending, startTransition] = useTransition()
	const [open, setOpen] = useState(false)
	const { handleSubmit, reset, register, setValue, watch, formState } = useForm<
		z.infer<typeof createSupplierValidation>
	>({
		resolver: zodResolver(createSupplierValidation),
		defaultValues: {
			country: 'DK',
		},
	})

	const formValues = watch()

	function onSubmit(values: z.infer<typeof createSupplierValidation>) {
		startTransition(async () => {
			const res = await createSupplierAction(values)
			if (res && res.serverError) {
				toast.error(t(siteConfig.errorTitle), {
					description: t('create.toast-error'),
				})
				return
			}
			toast.success(t(siteConfig.successTitle), {
				description: 'create.toast-success',
			})
			onOpenChange(false)
		})
	}

	function onOpenChange(open: boolean) {
		reset()
		setOpen(open)
	}

	return (
		<DialogV2 open={open} onOpenChange={onOpenChange}>
			<DialogTriggerV2 asChild>
				<Button variant='outline' size='icon' tooltip={t('create.tooltip')}>
					<Icons.plus className='size-4' />
				</Button>
			</DialogTriggerV2>
			<DialogContentV2 className='max-w-md'>
				<DialogHeaderV2>
					<div className='flex items-center gap-2'>
						<Icons.plus className='size-4 text-primary' />
						<DialogTitleV2>{t('create.title')}</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<form
					onSubmit={handleSubmit(onSubmit)}
					className='px-3 space-y-4'
					id='create-form'>
					<p className='text-sm text-muted-foreground'>
						{t('create.description')}
					</p>
					<div className='flex items-center gap-2'>
						<div className='grid gap-1.5'>
							<Label htmlFor='country'>
								{t('create.country')}
								<RedAsterisk />
							</Label>
							<Select
								name='country'
								defaultValue={formValues.country}
								onValueChange={(val: SupplierContry) =>
									setValue('country', val, { shouldValidate: true })
								}>
								<SelectTrigger className='w-24'>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{supplierContries.map((c, i) => (
										<SelectItem value={c} key={`${c}-${i}`}>
											<div className='flex items-center gap-1.5'>
												<ReactCountryFlag
													countryCode={c}
													svg
													style={{
														width: '17px',
														height: '17px',
														borderRadius: '6px',
													}}
												/>
												{c}
											</div>
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className='grid gap-1.5 w-full'>
							<Label htmlFor='name'>
								{t('create.name')}
								<RedAsterisk />
							</Label>
							<Input
								{...register('name')}
								name='name'
								id='name'
								autoFocus
								type='text'
							/>
						</div>
					</div>
					<div className='grid gap-1.5 w-full'>
						<Label htmlFor='idOfClient'>{t('create.idOfClient')}</Label>
						<Input
							{...register('idOfClient')}
							name='idOfClient'
							id='idOfClient'
							type='text'
						/>
					</div>
					<div className='grid gap-1.5 w-full'>
						<Label htmlFor='contactPerson'>{t('create.contact-person')}</Label>
						<Input
							{...register('contactPerson')}
							name='contactPerson'
							id='contactPerson'
							type='text'
						/>
					</div>
					<div className='flex items-center gap-2'>
						<div className='grid gap-1.5 w-full'>
							<Label htmlFor='phone'>{t('create.phone')}</Label>
							<Input
								{...register('phone')}
								name='phone'
								id='phone'
								type='tel'
							/>
						</div>
						<div className='grid gap-1.5 w-full'>
							<Label htmlFor='email'>{t('create.email')}</Label>
							<Input
								{...register('email')}
								name='email'
								id='email'
								type='email'
							/>
						</div>
					</div>
				</form>
				<DialogFooterV2>
					<Button
						onClick={() => onOpenChange(false)}
						size='sm'
						variant='outline'>
						{t('create.btn-close')}
					</Button>
					<Button
						disabled={pending || !formState.isValid}
						size='sm'
						form='create-form'
						type='submit'
						className='flex items-center gap-2'>
						{pending && <Icons.spinner className='size-3.5 animate-spin' />}
						{t('create.btn-create')}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}

function RedAsterisk() {
	return <span className='text-destructive'>*</span>
}
