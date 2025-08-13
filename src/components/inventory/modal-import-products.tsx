'use client'

import {
	finishProductsAction,
	importProductsAction,
} from '@/app/[lng]/(site)/varer/produkter/actions'
import { productsDataValidation } from '@/app/[lng]/(site)/varer/produkter/validation'
import { useTranslation } from '@/app/i18n/client'
import { Button, buttonVariants } from '@/components/ui/button'
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from '@/components/ui/dialog'
import { Icons } from '@/components/ui/icons'
import { Label } from '@/components/ui/label'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { useMediaQuery } from '@/hooks/use-media-query'
import { readAndValidateFileData } from '@/lib/import/file-reader'
import { chunkArray, updateChipCount } from '@/lib/utils'
import Link from 'next/link'
import { useCallback, useState, useTransition } from 'react'
import { useDropzone } from 'react-dropzone'
import { z, ZodError } from 'zod'
import { Alert, AlertDescription, AlertTitle } from '../ui/alert'
import { Progress } from '../ui/progress'
import { ScrollArea } from '../ui/scroll-area'

const headerMap: Map<string, string> = new Map([
	['vare_nr', 'sku'],
	['stregkode', 'barcode'],
	['varegruppe', 'group'],
	['enhed', 'unit'],
	['varetekst_1', 'text1'],
	['varetekst_2', 'text2'],
	['varetekst_3', 'text3'],
	['kostpris', 'costPrice'],
	['salgspris', 'salesPrice'],
	['spaerret', 'isBarred'],
	['note', 'note'],
	['min_beh', 'minimum'],
	['max_bestilling', 'maximum'],
	['bestillingsmaengde', 'orderAmount'],
	['product_no', 'sku'],
	['barcode', 'barcode'],
	['product_group', 'group'],
	['unit', 'unit'],
	['product_text_1', 'text1'],
	['product_text_2', 'text2'],
	['product_text_3', 'text3'],
	['cost_price', 'costPrice'],
	['sales_price', 'salesPrice'],
	['barred', 'isBarred'],
	['min_stock', 'minimum'],
	['max_order', 'maximum'],
	['order_amount', 'orderAmount'],
])

function sanitizeHeader(header: string): string {
	return header
		.replaceAll(/æ/gi, 'ae')
		.toLowerCase()
		.replaceAll(' ', '_')
		.replaceAll(/[^a-zA-Z0-9_]/g, '')
}

export function ModalImportProducts({ allUnits }: { allUnits: string[] }) {
	const [pending, startTransition] = useTransition()
	const [open, setOpen] = useState(false)
	const [isReading, setIsReading] = useState(false)
	const [uploadedAmount, setUploadedAmount] = useState(0)
	const [responseErrors, setResponseErrors] = useState<string[]>([])
	const [isDone, setIsDone] = useState(false)
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'other')
	const { t: validationT } = useTranslation(lng, 'validation')
	const schema = productsDataValidation(validationT, allUnits)

	const [rows, setRows] = useState<z.infer<typeof schema>>([])
	const [errors, setErrors] = useState<
		ZodError<ReturnType<typeof productsDataValidation>> | undefined
	>(undefined)
	const [updated, setUpdated] = useState(0)
	const [created, setCreated] = useState(0)
	const desktop = '(min-width: 768px)'
	const isDesktop = useMediaQuery(desktop)

	const onDrop = useCallback(async (files: File[]) => {
		setIsReading(true)
		setErrors(undefined)
		setRows([])
		setIsDone(false)

		const headers = schema.innerType().element.innerType().keyof().options
		const dataRes = await readAndValidateFileData(
			files[0],
			schema,
			validationT,
			{
				expectedHeaders: headers,
				transformHeaders: h => headerMap.get(sanitizeHeader(h)) ?? h,
				debug: true,
			},
		).catch(err => {
			console.log(err)
			return {
				success: false,
				errors: err?.errors ?? new z.ZodError([]),
				data: [],
			}
		})
		setIsReading(false)

		if (!dataRes.success) {
			setErrors(dataRes.errors)
		} else {
			setRows(dataRes.data)
		}
	}, [])

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		maxFiles: 1,
		accept: {
			'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [
				'.xlsx',
			],
			'application/vnd.ms-excel': ['.xls'],
			//'text/csv': ['.csv'],
		},
	})

	function onOpenChange(open: boolean) {
		if (pending) return
		setOpen(open)
		setRows([])
		setUpdated(0)
		setCreated(0)
		setErrors(undefined)
		setResponseErrors([])
		setUploadedAmount(0)
		setIsDone(false)
	}

	function onSubmit(values: z.infer<typeof schema>) {
		setUpdated(0)
		setCreated(0)
		setErrors(undefined)
		setResponseErrors([])
		setUploadedAmount(0)
		setIsDone(false)

		startTransition(async () => {
			const CHUNK_SIZE = 50

			const chunkedArray = chunkArray(values, CHUNK_SIZE)

			for (let i = 0; i < chunkedArray.length; i++) {
				const chunk = chunkedArray[i]
				const start = i * CHUNK_SIZE
				const errorMsg = `${t('modal-import-products.something-went-wrong')} ${start + 1} ${t('modal-import-products.to')} ${start + CHUNK_SIZE}.`
				const res = await importProductsAction(chunk)

				if (res && res.serverError) {
					setResponseErrors(prev => [`${errorMsg} ${res.serverError}`, ...prev])
					continue
				} else if (res && res.data) {
					setUpdated(prev => prev + res.data!.updated)
					setCreated(prev => prev + res.data!.created)
				}

				setUploadedAmount(prev => prev + chunk.length)
			}
			setIsDone(true)
			setRows([])
			await finishProductsAction()
			updateChipCount()
		})
	}

	if (!isDesktop) return null

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogTrigger asChild>
				<Button
					size='icon'
					variant='outline'
					onClick={() => setOpen(true)}
					tooltip={t('tooltips.import-products')}>
					<Icons.cloudUpload className='size-[18px]' />
				</Button>
			</DialogTrigger>
			<DialogContent className='max-w-xl'>
				<DialogHeader>
					<DialogTitle>{t('modal-import-products.title')}</DialogTitle>
					<DialogDescription>
						{t('modal-import-products.description')}
					</DialogDescription>
				</DialogHeader>
				<div className='flex flex-col gap-4'>
					<div className='grid gap-2'>
						<Label>{t('modal-import-products.before-upload')}</Label>
						<p className='text-muted-foreground text-sm'>
							{t('modal-import-products.import-criteria')}
						</p>
						<p className='text-muted-foreground text-sm'>
							{t('modal-import-products.unsure-look-faq')}{' '}
							<Link
								href={`/faq?spørgsmål=${t('modal-import-products.faq-link')}`}
								target='_blank'
								className='underline'>
								&quot;{t('modal-import-products.faq-link')}&quot;
							</Link>
						</p>
					</div>
					<div className='border rounded-md p-4 flex items-center justify-between gap-4'>
						<div className='flex flex-col gap-1'>
							<div className='flex items-center gap-2'>
								<Icons.sheet className='size-[18px] text-primary' />

								<p className='text-sm'>
									{t('modal-import-products.file-example')}
								</p>
							</div>
							<p className='text-xs text-muted-foreground'>
								{t('modal-import-products.file-import-example')}
							</p>
						</div>
						<a
							className={buttonVariants({ size: 'sm', variant: 'outline' })}
							href={`/assets/product-import-example-${lng}.xlsx`}
							rel='noopener noreferrer'
							download>
							{t('modal-import-products.download')}
						</a>
					</div>
					<div
						{...getRootProps()}
						className='border-dashed border-2 rounded-md px-6 py-10 hover:border-primary transition-colors cursor-pointer'>
						<input {...getInputProps()} />
						<div className='text-muted-foreground text-sm grid place-items-center'>
							{isReading ? (
								<div className='flex gap-2 items-center'>
									<p>{t('modal-import-products.loading-the-file')}</p>
									<Icons.spinner className='animate-spin size-3' />
								</div>
							) : rows.length > 0 ? (
								<p>
									{t('modal-import-products.loaded-and-ready')} {rows.length}{' '}
									{t('modal-import-products.loaded-and-ready2')}
								</p>
							) : (
								<p>
									{isDragActive
										? t('modal-import-products.drag-and-drop')
										: t('modal-import-products.drag-and-drop2')}
								</p>
							)}
						</div>
					</div>
					{errors && errors.issues && (
						<div className='flex flex-col gap-1 text-destructive text-sm'>
							<p className='font-semibold'>{t(siteConfig.errorTitle)}</p>
							{errors.issues.slice(0, 5).map((issue, i) => {
								const rowNumber = Number(issue.path[0]) + 2
								const rowKey =
									issue.code == 'unrecognized_keys'
										? issue.keys[0]
										: issue.path[1]
								const rowMsg = issue.message

								return (
									<div key={i}>
										<p>
											{!isNaN(rowNumber) &&
												`${t('modal-import-products.error-on-row')} ${isNaN(rowNumber) ? '' : rowNumber} ${t('modal-import-products.in')} ${validationT('products.header-name', { context: rowKey })}: `}
											{rowMsg}
										</p>
									</div>
								)
							})}
							{errors.issues.length > 5 && (
								<p className='text-foreground'>
									{errors.issues.length - 5}{' '}
									{t('modal-import-products.more-errors')}
								</p>
							)}
						</div>
					)}
					{responseErrors.length > 0 && (
						<Alert variant='destructive' className='border-destructive'>
							<Icons.alert className='size-4 !top-3 ' />
							<AlertTitle className=''>{t(siteConfig.errorTitle)}</AlertTitle>
							<ScrollArea maxHeight='max-h-[140px]'>
								{responseErrors.map((e, i) => (
									<AlertDescription key={i}>{e}</AlertDescription>
								))}
							</ScrollArea>
						</Alert>
					)}
					{isDone && responseErrors.length == 0 && (
						<Alert variant='default' className='border-success'>
							<Icons.check className='size-4 !top-3 text-success' />
							<AlertTitle className='text-success'>
								{t('modal-import-products.import-completed-title')}
							</AlertTitle>
							<AlertDescription className='text-success'>
								{t('modal-import-products.import-completed-description')}{' '}
								{t('modal-import-products.items-created', { count: created })}
								{'. '}
								{t('modal-import-products.items-updated', { count: updated })}
								{'. '}
							</AlertDescription>
						</Alert>
					)}
					{pending && (
						<Progress max={100} value={(uploadedAmount / rows.length) * 100} />
					)}
					<Button
						disabled={pending || rows.length == 0}
						variant='default'
						size='lg'
						className='w-full gap-2'
						onClick={() => onSubmit(rows)}>
						{pending
							? `${uploadedAmount} ${t('modal-import-products.uploaded-of')} ${rows.length}`
							: t('modal-import-products.upload-to-catalog')}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}
