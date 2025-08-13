'use client'

import {
	createReorderAction,
	updateReorderAction,
} from '@/app/[lng]/(site)/genbestil/actions'
import {
	createReorderValidation,
	updateReorderValidation,
} from '@/app/[lng]/(site)/genbestil/validation'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { hasPermissionByRank } from '@/data/user.types'
import { Reorder } from '@/lib/database/schema/reorders'
import { cn, updateChipCount } from '@/lib/utils'
import { zodResolver } from '@hookform/resolvers/zod'
import { TFunction } from 'i18next'
import { User } from 'lucia'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { IfElse } from '../common/if-else'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { DeleteRestockModal } from './product-delete-reorder'

interface Props {
	productID: number
	reorder: Reorder | undefined
	user: User
}

function getValidationSchema(t: TFunction<'genbestil'>, doUpdate: boolean) {
	if (doUpdate) {
		return updateReorderValidation(t)
	} else {
		return createReorderValidation(t)
	}
}

export function ProductReorder({ productID, reorder, user }: Props) {
	const [pending, startTransition] = useTransition()
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter')
	const { t: tValidation } = useTranslation(lng, 'genbestil')
	const [isEditing, setIsEditing] = useState(false)
	const schema = getValidationSchema(tValidation, reorder !== undefined)
	const router = useRouter()

	const form = useForm<z.infer<typeof schema>>({
		resolver: zodResolver(schema),
		defaultValues: {
			productID: productID,
			minimum: reorder?.minimum,
			orderAmount: reorder?.orderAmount,
			maxOrderAmount: reorder?.maxOrderAmount ?? 0,
		},
		mode: 'all',
	})
	const {
		register,
		reset,
		handleSubmit,
		formState: { errors, isValid },
		setValue,
	} = form

	function onSubmit(values: z.infer<typeof schema>) {
		startTransition(async () => {
			let action
			if (reorder) {
				action = updateReorderAction
			} else {
				action = createReorderAction
			}

			const res = await action(values)

			if (res && res.serverError) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: res.serverError,
				})
				return
			}

			if (res && res.validationErrors) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: t('modal-create-reorder.error-occured'),
				})
				return
			}

			toast.success(t(`common:${siteConfig.successTitle}`), {
				description: 'Minimumsbeholdning oprettet',
			})
			updateChipCount()
			setIsEditing(false)
			router.refresh()
		})
	}

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className='lg:w-1/2 border rounded-md relative'>
			<div
				className={cn(
					'z-40 hidden bg-foreground/30 w-full h-full absolute rounded-md place-items-center',
					!reorder && !isEditing && 'grid',
				)}>
				<div className='flex flex-col gap-2.5 items-center bg-background rounded-md shadow-md'>
					<div className='border-b py-2 flex items-center w-full'>
						<p className='px-2 text-sm font-medium'>
							{t('details-page.reorder.no-reorder-title')}
						</p>
					</div>
					<div className='px-2 flex flex-col gap-2 pb-2 max-w-96'>
						<p className='text-sm'>
							{t('details-page.reorder.no-reorder-description')}
						</p>
						{hasPermissionByRank(user.role, 'bruger') && (
							<Button
								type='button'
								className='w-fit ml-auto'
								size='sm'
								onClick={() => setIsEditing(true)}>
								{t('details-page.reorder.btn-no-reorder')}
							</Button>
						)}
					</div>
				</div>
			</div>
			<div
				className={cn(
					'p-4 flex flex-col gap-2 h-full',
					!reorder && !isEditing && 'blur-sm',
				)}>
				<div className='flex items-start justify-between mb-1'>
					<div>
						<p className='font-medium'>{t('details-page.reorder.title')}</p>
						<p className='text-muted-foreground text-sm text-pretty'>
							{t('details-page.reorder.description')}
						</p>
					</div>
					<div className='flex'>
						{hasPermissionByRank(user.role, 'bruger') && (
							<IfElse
								condition={isEditing}
								falseComp={
									<div className='flex items-center gap-2'>
										<DeleteRestockModal productID={productID} />
										<Button
											key={'set-is-editing-reorder-form-btn'}
											type='button'
											variant='outline'
											size='sm'
											className='flex items-center gap-2'
											onClick={() => setIsEditing(true)}>
											{t('details-page.reorder.btn-edit')}
										</Button>
									</div>
								}
								trueComp={
									<div className='flex items-center gap-2'>
										<Button
											type='button'
											size='sm'
											variant='outline'
											className='flex items-center gap-2'
											onClick={() => {
												reset()
												setIsEditing(false)
											}}>
											{t('details-page.reorder.btn-cancel')}
										</Button>
										<Button
											key={'submit-reorder-form-btn'}
											type='submit'
											size='sm'
											className='flex items-center gap-2'
											disabled={!isValid}>
											{pending && (
												<Icons.spinner className='animate-spin size-4' />
											)}
											{t('details-page.reorder.btn-confirm', {
												context: (!!reorder).toString(),
											})}
										</Button>
									</div>
								}
							/>
						)}
					</div>
				</div>
				<div className='flex flex-col gap-1 w-full'>
					<Label htmlFor='minimum'>
						{t('details-page.reorder.label-minimum')}
					</Label>
					<IfElse
						condition={isEditing}
						falseComp={
							<div className='h-9 px-3 mb-[1.375rem] flex items-center border rounded-md bg-muted/50 text-sm'>
								{reorder?.minimum}
							</div>
						}
						trueComp={
							<div className='space-y-0.5'>
								<Input id='minimum' {...register('minimum' as const)} />
								<p className='text-sm text-destructive min-h-5'>
									{errors.minimum?.message}
								</p>
							</div>
						}
					/>
				</div>
				<div className='flex flex-col gap-1 w-full'>
					<Label htmlFor='orderAmount'>
						{t('details-page.reorder.label-orderAmount')}
					</Label>
					<p className='text-sm text-muted-foreground'>
						{t('details-page.reorder.orderAmount-description')}
					</p>
					<IfElse
						condition={isEditing}
						falseComp={
							<div className='h-9 px-3 flex mb-[1.375rem] items-center border rounded-md bg-muted/50 text-sm'>
								{reorder?.orderAmount}
							</div>
						}
						trueComp={
							<div className='space-y-0.5'>
								<Input
									id='orderAmount'
									{...register('orderAmount' as const, {
										deps: 'maxOrderAmount',
									})}
								/>
								<p className='text-sm text-destructive min-h-5'>
									{errors.orderAmount?.message}
								</p>
							</div>
						}
					/>
				</div>
				<div className='flex flex-col gap-1 w-full'>
					<Label htmlFor='maxOrderAmount'>
						{t('details-page.reorder.label-maxOrderAmount')}
					</Label>
					<p className='text-sm text-muted-foreground -mt-1.5'>
						{t('details-page.reorder.maxAmount-description')}
					</p>
					<IfElse
						condition={isEditing}
						falseComp={
							<div className='h-9 px-3 flex mb-[1.375rem] items-center border rounded-md bg-muted/50 text-sm'>
								{reorder?.maxOrderAmount}
							</div>
						}
						trueComp={
							<div className='space-y-0.5'>
								<Input
									id='maxOrderAmount'
									{...register('maxOrderAmount' as const, {
										onBlur: e => {
											if (e.target.value == '') {
												setValue('maxOrderAmount', 0, {
													shouldValidate: true,
												})
											}
										},
										deps: 'orderAmount',
									})}
								/>
								<p className='text-sm text-destructive min-h-5'>
									{errors.maxOrderAmount?.message}
								</p>
							</div>
						}
					/>
				</div>
			</div>
		</form>
	)
}
