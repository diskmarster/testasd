import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { cn } from '@/lib/utils'
import { useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import * as XLSX from 'xlsx'

export type AcceptedFile = {
	filename: string
	data: Record<string, any>[]
}

interface Props {
	onAccepted: (files: AcceptedFile[]) => void
}

export function ExcelFileImporter({ onAccepted }: Props) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'common', {
		keyPrefix: 'excel-file-importer',
	})

	const onDrop = useCallback(
		async (acceptedFiles: File[]) => {
			const processedFiles: AcceptedFile[] = []

			await Promise.all(
				acceptedFiles.map(file => {
					return new Promise<void>((resolve, reject) => {
						const reader = new FileReader()

						reader.onload = event => {
							try {
								const workbook = XLSX.read(event.target?.result, {
									type: 'array',
								})
								const sheetname = workbook.SheetNames[0]
								const sheet = workbook.Sheets[sheetname]
								const sheetData = XLSX.utils.sheet_to_json(sheet)

								processedFiles.push({
									filename: file.name,
									data: sheetData as Record<string, any>[],
								})
								resolve()
							} catch (error) {
								reject(error)
							}
						}

						reader.onerror = () => reject(reader.error)
						reader.readAsArrayBuffer(file)
					})
				}),
			)

			onAccepted(processedFiles)
		},
		[onAccepted],
	)

	const accept = {
		'pplication/vnd.ms-excel': ['.xlsx'],
	}

	const maxSize = 1_048_576

	const { getRootProps, getInputProps, isDragActive } = useDropzone({
		onDrop,
		accept,
		maxSize,
	})

	function bytesToMegabytes(nbytes: number): string {
		return Math.fround(nbytes / 1000000).toFixed(1)
	}

	return (
		<div className='space-y-1.5'>
			<div
				className={cn(
					'border border-muted-foreground border-dashed rounded-md px-4 py-12 grid place-items-center text-sm text-muted-foreground',
					'hover:bg-muted/50 transition-colors cursor-pointer',
				)}
				{...getRootProps()}>
				<input {...getInputProps()} />
				{isDragActive ? (
					<p>{t('drag-and-drop')}</p>
				) : (
					<p>{t('drag-and-drop-plus')}</p>
				)}
			</div>
			<div className='flex items-center justify-between text-xs px-0.5 text-muted-foreground font-medium'>
				<span>
					{t('supported-extensions')}
					{Object.values(accept).flat().join(', ')}
				</span>
				<span>
					{t('max-size')}
					{bytesToMegabytes(maxSize)}MB
				</span>
			</div>
		</div>
	)
}
