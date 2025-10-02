"use client"

import {
	DialogContentV2,
	DialogFooterV2,
	DialogHeaderV2,
	DialogTitleV2,
	DialogTriggerV2,
	DialogV2,
} from '../ui/dialog-v2'
import { Button, buttonVariants } from '../ui/button'
import { Icons } from '../ui/icons'
import React, { useState, useTransition } from 'react'
import { preparePDFAction } from '@/app/[lng]/(site)/oversigt/actions'
import { toast } from 'sonner'
import { ProductLabel, productLabelSizes } from '@/lib/pdf/product-label'
import { emitCustomEvent, useCustomEventListener } from 'react-custom-events'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

interface Props extends React.ButtonHTMLAttributes<'button'>, VariantProps<typeof buttonVariants> {
	labelData: ProductLabel[]
}

export function ModalProductLabelTrigger({
	size = 'icon',
	variant = 'ghost',
	className: classNameProp,
	labelData,
}: Props) {
	function onclick() {
		emitCustomEvent("ModalProductLabel", labelData)
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

	useCustomEventListener('ModalProductLabel', (data: typeof rows) => {
		setRows(data)
		setOpen(true)
	})

	function getPdf() {
		startTransition(async () => {
			const res = await preparePDFAction({
				size: [width, height],
				copies,
				products: rows
			})

			if (!res) {
				toast("ingen response")
			}

			if (res?.serverError) {
				toast(res.serverError)
			}

			function base64ToUint8Array(base64: string) {
				const raw = atob(base64)
				const uint8Array = new Uint8Array(raw.length)
				for (let i = 0; i < raw.length; i++) {
					uint8Array[i] = raw.charCodeAt(i)
				}
				return uint8Array
			}

			if (res?.data) {
				const uint8Array = base64ToUint8Array(res.data.pdf)
				const blob = new Blob([uint8Array], { type: "application/pdf" })
				const objectURL = URL.createObjectURL(blob)

				const anchor = document.createElement("a")
				anchor.href = objectURL
				anchor.target = "_blank"
				anchor.click()
			}
		})
	}

	function isActive(labelSize: [number, number]): boolean {
		return labelSize[0] == width && labelSize[1] == height
	}

	return (
		<DialogV2 open={open} onOpenChange={setOpen}>
			{false && (
				<DialogTriggerV2 asChild>
					<Button size="icon" variant="ghost">
						<Icons.printer className='size-4' />
					</Button>
				</DialogTriggerV2>
			)}
			<DialogContentV2>
				<DialogHeaderV2>
					<div className='flex items-center gap-2'>
						<Icons.printer className='size-4 text-primary' />
						<DialogTitleV2>Print labels</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<div className='px-3'>
					<div className='space-y-4'>
						<div className='grid gap-1.5'>
							<Label>Antal kopier</Label>
							<Input
								type="number"
								value={copies}
								onChange={e => {
									setCopies(e.target.valueAsNumber)
								}}
							/>
						</div>

						<div className='grid gap-1.5'>
							<div>
								<Label>Label størrelse</Label>
								<p className="text-sm text-muted-foreground">Størrelse angives i millimeter (mm)</p>
							</div>
							<div className="flex items-center gap-2 my-4">
								{Object.entries(productLabelSizes).map(([key, value]) => (
									<Button
										key={key}
										onClick={() => {
											setWidth(value[0])
											setHeight(value[1])
										}}
										size="sm"
										variant="secondary"
										className={cn("capitalize w-full border border-transparent", isActive(value) && 'border-primary')}>
										{key}
									</Button>
								))}
							</div>
							<div className="flex items-center gap-2">
								<div className="grid gap-1.5 w-full">
									<Label>Længde</Label>
									<Input
										type="number"
										value={width}
										onChange={e => setWidth(e.target.valueAsNumber)}
									/>
								</div>
								<div className="grid gap-1.5 w-full">
									<Label>Højde</Label>
									<Input
										type="number"
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
						Åben Print
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}
