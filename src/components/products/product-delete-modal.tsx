'use client'

import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { FormEvent, useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { Button } from '../ui/button'
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
import { deleteProductAction } from '@/app/[lng]/(site)/varer/produkter/actions'
import { toast } from 'sonner'
import { siteConfig } from '@/config/site'

export function DeleteProductModal() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter')

	const [pending, startTransition] = useTransition()

	const [open, setOpen] = useState(false)
	const [productID, setProductID] = useState<number>()
	const [productSku, setProductSku] = useState<string>()
	const [skuInput, setSkuInput] = useState<string>()

	useCustomEventListener(
		'deleteProductByID',
		({ id, sku }: { id: number; sku: string }) => {
			setOpen(true)
			setProductID(id)
			setProductSku(sku)
		},
	)

	const onOpenChange = (val: boolean) => {
		setOpen(val)
		if (!val) {
			setProductID(undefined)
			setProductSku(undefined)
			setSkuInput(undefined)
		}
	}

	const onSubmit = <T = Element,>(e: FormEvent<T>) => {
		e.preventDefault()

		if (skuInput !== productSku || productID == undefined) {
			console.error('invalid input')
			return
		}

		startTransition(async () => {
			const res = await deleteProductAction({productID})
			if (res && res.serverError) {
				toast.error(t(siteConfig.errorTitle), {description: res.serverError})
			} else if (res && res.validationErrors) {
				toast.error(t(siteConfig.errorTitle), {description: t('')})
			} else {
				toast.success(t('delete-product-modal.product-deleted'))
				onOpenChange(false)
			}
		})
	}

	return (
		<DialogV2 open={open} onOpenChange={onOpenChange}>
			<DialogContentV2 className='w-max'>
				<DialogHeaderV2>
					<DialogTitleV2 className='flex gap-2 items-center'>
						<Icons.trash className='size-4 text-destructive' />
						{t('delete-product-modal.title')}
					</DialogTitleV2>
				</DialogHeaderV2>
				<form
					onSubmit={onSubmit}
					id='delete-product-form'
					className='grid gap-8 px-8'>
					<div className='flex flex-col w-full justify-center text-sm text-center text-pretty'>
						<p className='text-sm text-pretty'>
							{t('delete-product-modal.description-delete')}{' '}
							<span className='font-semibold'>{productSku}</span>?{' '}
						</p>
						<p className='text-sm wrap-pretty'>
							{t('delete-product-modal.description-no-redo')}{' '}
							{t('delete-product-modal.description-history')}.
						</p>
					</div>
					<div className='grid gap-1'>
						<Label className='font-medium'>
							{t('delete-product-modal.label-start')}
							<span className='font-semibold italic cursor-pointer hover:underline' onClick={async () => {
								try {
									await navigator.clipboard.writeText(productSku ?? '')
									toast.success(t('delete-product-modal.sku-copied'))
								} catch(e) {
									console.error((e as Error).message)
									toast.error(t('delete-product-modal.copy-failed'))
								}
							}}>
								{productSku}
							</span>
							{t('delete-product-modal.label-end')}
						</Label>
						<Input
							id='product-sku'
							placeholder={productSku}
							value={skuInput}
							onChange={(e) => setSkuInput(e.target.value)}
						/>
					</div>
				</form>
				<DialogFooterV2>
					<div className='flex justify-end gap-2'>
						<Button
							type='button'
							onClick={() => onOpenChange(false)}
							variant={'outline'}>
							{t('delete-product-modal.cancel-btn')}
						</Button>
						<Button
							type='submit'
							form='delete-product-form'
							variant={'destructive'}
							disabled={pending || skuInput != productSku}>
							{pending && <Icons.spinner className='size-4 animate-spin mr-2'/>}
							{t('delete-product-modal.delete-btn')}
						</Button>
					</div>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}
