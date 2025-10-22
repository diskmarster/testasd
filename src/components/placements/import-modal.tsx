'use client'

import { importPlacementsAction } from '@/app/[lng]/(site)/varer/placeringer/actions'
import { useTranslation } from '@/app/i18n/client'
import { Button, buttonVariants } from '@/components/ui/button'
import {
	DialogContentV2,
	DialogDescriptionV2,
	DialogFooterV2,
	DialogHeaderV2,
	DialogTitleV2,
	DialogTriggerV2,
	DialogV2,
} from '@/components/ui/dialog-v2'
import {
	Item,
	ItemActions,
	ItemContent,
	ItemDescription,
	ItemMedia,
	ItemTitle,
} from '@/components/ui/item'
import { useLanguage } from '@/context/language'
import { cn } from '@/lib/utils'
import Link from 'next/link'
import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { AcceptedFile, ExcelFileImporter } from '../common/excel-file-importer'
import { Icons } from '../ui/icons'
import { Label } from '../ui/label'
import { ScrollArea } from '../ui/scroll-area'
import { TooltipWrapper } from '../ui/tooltip-wrapper'

const importPlacementSchema = z.array(
	z.record(
		z.union([
			z.literal('navn'),
			z.literal('Navn'),
			z.literal('name'),
			z.literal('Name'),
		]),
		z.string(),
	),
)

export function ImportPlacementsModal() {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'placeringer')

	const [open, setOpen] = useState(false)
	const [newPlacements, setNewPlacements] = useState<string[]>([])
	const [pending, startTransition] = useTransition()

	const [failedInserts, setFailedInserts] = useState<string[]>([])

	function onAccepted(files: AcceptedFile[]) {
		let data = []

		for (let file of files) {
			const result = importPlacementSchema.safeParse(file.data)
			if (!result.success) {
				toast(t('modal-import.invalid-data-toast', { filename: file.filename }))
				continue
			}
			data.push(file.data)
		}

		const placements = data
			.flat()
			.map(row => {
				const nameKey = Object.keys(row).find(
					key => key.toLowerCase() === 'navn' || key.toLowerCase() === 'name',
				)

				return nameKey ? String(row[nameKey]).trim() : ''
			})
			.filter(name => name !== '')

		setNewPlacements(Array.from(new Set(placements)))
	}

	function submit() {
		startTransition(async () => {
			const response = await importPlacementsAction(newPlacements)
			if (response?.serverError) {
				toast(response?.serverError)
				return
			}

			if (
				response?.data?.failedInserts &&
				response.data.failedInserts.length > 0
			) {
				setFailedInserts(response.data.failedInserts)
				return
			}

			toast(t('modal-import.success-toast'))
			setOpen(false)
			reset()
		})
	}

	function reset() {
		setNewPlacements([])
		setFailedInserts([])
	}

	function didFail(name: string): boolean {
		if (failedInserts.length === 0) return false
		return failedInserts.includes(name)
	}

	return (
		<DialogV2 open={open} onOpenChange={setOpen}>
			<DialogTriggerV2 asChild>
				<Button tooltip={t('modal-import.title')} size='icon' variant='outline'>
					<Icons.cloudUpload className='size-4' />
				</Button>
			</DialogTriggerV2>
			<DialogContentV2>
				<DialogHeaderV2>
					<div className='flex items-center gap-2'>
						<Icons.cloudUpload className='size-4 text-primary' />
						<DialogTitleV2>{t('modal-import.title')}</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<div className='px-3 space-y-4'>
					<DialogDescriptionV2>
						{t('modal-import.description')}
					</DialogDescriptionV2>
					{newPlacements.length === 0 && (
						<>
							<div className='flex w-full max-w-lg flex-col gap-6'>
								<Item variant='outline'>
									<ItemMedia variant='icon'>
										<Icons.sheet className='text-primary' />
									</ItemMedia>
									<ItemContent>
										<ItemTitle>{t('modal-import.file-example')}</ItemTitle>
										<ItemDescription>
											{t('modal-import.file-example-sub')}
										</ItemDescription>
									</ItemContent>
									<ItemActions>
										<Link
											className={cn(
												buttonVariants({ size: 'sm', variant: 'outline' }),
											)}
											href={`/assets/import-placements-example-${lng}.xlsx`}
											rel='noopener noreferrer'>
											{t('modal-import.file-button')}
										</Link>
									</ItemActions>
								</Item>
							</div>
							<div className='space-y-1.5'>
								<Label>{t('modal-import.file-label')}</Label>
								<ExcelFileImporter onAccepted={onAccepted} />
							</div>
						</>
					)}
					{newPlacements.length > 0 && failedInserts.length > 0 && (
						<div className='border border-destructive py-2 px-3 rounded-md'>
							<div className='flex items-center gap-2'>
								<Icons.triangleAlert className='size-4 text-destructive' />
								<p className='text-destructive text-sm font-medium'>
									{t('modal-import.placement-error')}
								</p>
							</div>
							<p className='text-sm text-destructive'>
								{t('modal-import.placement-error-sub')}
							</p>
						</div>
					)}
					{newPlacements.length > 0 && (
						<div className='space-y-1.5'>
							<div>
								<Label>{t('modal-import.found-placements-label')}</Label>
								<p className='text-sm text-muted-foreground'>
									{t('modal-import.found-placements-sub', {
										count: newPlacements.length,
									})}
								</p>
							</div>
							<div className='shadow-sm rounded-md border'>
								<div className='bg-muted px-3 text-xs font-medium py-2 rounded-t-md border-b'>
									<span>{t('modal-import.placement-label')}</span>
								</div>
								<ScrollArea
									maxHeight='max-h-60'
									className='[&>div>div]:divide-y rounded-b-md'>
									{newPlacements.map((p, i) => {
										const failed = didFail(p)
										return (
											<div
												key={`${p}-${i}`}
												className={cn(
													'py-2 px-3 flex items-center justify-between',
													failed && 'bg-destructive/5',
												)}>
												<div className='flex items-center gap-2'>
													<p className='text-sm leading-none'>{p}</p>
													{failed && (
														<TooltipWrapper
															tooltip={t(
																'modal-import.placement-error-tooltip',
															)}>
															<Icons.triangleAlert className='text-destructive size-4' />
														</TooltipWrapper>
													)}
												</div>
												<Button
													size='iconSm'
													variant='outline'
													className='hover:bg-destructive transition-colors hover:border-transparent group'
													onClick={() =>
														setNewPlacements(old => old.filter(o => o != p))
													}>
													<Icons.trash className='size-3 group-hover:text-destructive-foreground' />
												</Button>
											</div>
										)
									})}
								</ScrollArea>
							</div>
						</div>
					)}
				</div>
				<DialogFooterV2>
					<Button size='sm' variant='outline' onClick={() => reset()}>
						{t('modal-import.clear-button')}
					</Button>
					<Button
						size='sm'
						onClick={submit}
						className='flex items-center gap-2'
						disabled={newPlacements.length < 1 || pending}>
						{pending && <Icons.spinner className='size-4 animate-spin' />}
						{t('modal-import.submit-button')}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}
