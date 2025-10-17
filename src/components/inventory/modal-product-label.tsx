'use client'

import { prepareProductLabelsPDFAction } from '@/app/[lng]/(site)/oversigt/actions'
import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { ProductLabel, productLabelSizes } from '@/lib/pdf/product-label'
import { base64ToUint8Array, cn } from '@/lib/utils'
import { VariantProps } from 'class-variance-authority'
import React, { useState, useTransition } from 'react'
import { emitCustomEvent, useCustomEventListener } from 'react-custom-events'
import { toast } from 'sonner'
import { Button, buttonVariants } from '../ui/button'
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

interface Props
	extends React.ButtonHTMLAttributes<'button'>,
		VariantProps<typeof buttonVariants> {
	labelData: ProductLabel[]
}

export function ModalProductLabelTrigger({
	size = 'icon',
	variant = 'ghost',
	className: classNameProp,
	labelData,
}: Props) {
	function onclick() {
		emitCustomEvent('ModalProductLabel', labelData)
	}

	return (
		<Button
			size={size}
			variant={variant}
			className={cn('size-6', classNameProp)}
			onClick={onclick}>
			<Icons.printer className='size-4' />
		</Button>
	)
}

export function ModalProductLabel() {
	const [open, setOpen] = useState(false)
	const [rows, setRows] = useState<ProductLabel[]>([])
	const [pending, startTransition] = useTransition()

	const [width, setWidth] = useState<number>(productLabelSizes['small'][0])
	const [height, setHeight] = useState<number>(productLabelSizes['small'][1])
	const [copies, setCopies] = useState(1)

	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter')

	useCustomEventListener('ModalProductLabel', (data: typeof rows) => {
		setRows(data)
		setOpen(true)
	})

	function getPdf() {
		startTransition(async () => {
			const res = await prepareProductLabelsPDFAction({
				size: [width, height],
				copies,
				products: rows,
			})

			if (res?.serverError) {
				toast(t('modal-product-label.error-toast'))
			}

			if (res?.data) {
				const uint8Array = base64ToUint8Array(res.data.pdf)
				const blob = new Blob([uint8Array], { type: 'application/pdf' })
				const objectURL = URL.createObjectURL(blob)

				const anchor = document.createElement('a')
				anchor.href = objectURL
				anchor.target = '_blank'
				anchor.click()
				setOpen(false)
			}
		})
	}

	function isActive(labelSize: [number, number]): boolean {
		return labelSize[0] == width && labelSize[1] == height
	}

	return (
		<DialogV2 open={open} onOpenChange={setOpen}>
			<DialogContentV2>
				<DialogHeaderV2>
					<div className='flex items-center gap-2'>
						<Icons.printer className='size-4 text-primary' />
						<DialogTitleV2>{t('modal-product-label.title')}</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<div className='px-3'>
					<div className='space-y-4'>
						<div className='grid gap-1.5'>
							<Label>{t('modal-product-label.copies')}</Label>
							<Input
								type='number'
								value={copies}
								onChange={e => {
									setCopies(e.target.valueAsNumber)
								}}
							/>
						</div>

						<div className='grid gap-1.5'>
							<div>
								<Label>{t("modal-product-label.size")}</Label>
								<p className="text-sm text-muted-foreground">{t('modal-product-label.size-description')}</p>
							</div>
							<div className='flex items-center gap-2 my-4'>
								{Object.entries(productLabelSizes).map(([key, value]) => (
									<Button
										key={key}
										onClick={() => {
											setWidth(value[0])
											setHeight(value[1])
										}}
										size='sm'
										variant='secondary'
										className={cn(
											'w-full border border-transparent',
											isActive(value) && 'border-primary',
										)}>
										{t('modal-product-label.size', { context: key })}
									</Button>
								))}
							</div>
							<div className='flex items-center gap-2'>
								<div className='grid gap-1.5 w-full'>
									<Label>{t('modal-product-label.width')}</Label>
									<Input
										type='number'
										value={width}
										onChange={e => setWidth(e.target.valueAsNumber)}
									/>
								</div>
								<div className='grid gap-1.5 w-full'>
									<Label>{t('modal-product-label.height')}</Label>
									<Input
										type='number'
										value={height}
										onChange={e => setHeight(e.target.valueAsNumber)}
									/>
								</div>
							</div>
						</div>
					</div>
				</div>
				<DialogFooterV2>
					<Button onClick={getPdf} className='flex items-center gap-2'>
						{pending && <Icons.spinner className='size-4 animate-spin' />}
						{t('modal-product-label.print-button')}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}
