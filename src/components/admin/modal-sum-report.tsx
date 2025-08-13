'use client'

import {
	fetchItemGroupsForCustomerActions,
	fetchLocationsForCustomerActions,
} from '@/app/[lng]/(site)/sys/kunder/actions'
import { genInventoryMovementsReportAction } from '@/app/actions'
import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { useSession } from '@/context/session'
import { HistoryType, historyTypes } from '@/data/inventory.types'
import { CustomerID } from '@/lib/database/schema/customer'
import {
	genInventoryMovementsExcel,
	genSummarizedReportPDF,
} from '@/lib/pdf/inventory-movements-rapport'
import { cn, formatDate } from '@/lib/utils'
import * as DFNs from 'date-fns'
import { endOfMonth, startOfMonth } from 'date-fns'
import { da } from 'date-fns/locale'
import { useEffect, useState, useTransition } from 'react'
import { DateRange } from 'react-day-picker'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { Button, buttonVariants } from '../ui/button'
import { Calendar } from '../ui/calendar'
import { Checkbox } from '../ui/checkbox'
import {
	DialogContentV2,
	DialogDescriptionV2,
	DialogFooterV2,
	DialogHeaderV2,
	DialogTitleV2,
	DialogTriggerV2,
	DialogV2,
} from '../ui/dialog-v2'
import { Icons } from '../ui/icons'
import { Label } from '../ui/label'
import { MultiSelect, Option } from '../ui/multi-select'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'

type HistoryTypeWithAll = HistoryType | 'all'

export function ModalSumReport() {
	const [pending, startTransition] = useTransition()
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'rapporter')
	const { user } = useSession()
	const [locations, setLocations] = useState<{ id: string; name: string }[]>([])
	const [selectedLocation, setSelectedLocation] = useState<string>()
	const [itemGroups, setItemGroups] = useState<Option[]>([])
	const [open, setOpen] = useState(false)
	const [fileType, setFileType] = useState<'pdf' | 'excel'>('pdf')
	const [date, setDate] = useState<DateRange | undefined>({
		from: startOfMonth(new Date()),
		to: endOfMonth(new Date()),
	})
	const [isSummarized, setIsSummarized] = useState(false)
	const [selectedTypes, setSelectedTypes] = useState<HistoryTypeWithAll[]>([
		'all',
	])
	const [selectedGroups, setSelectedGroups] = useState<string[]>(['all'])
	const [isWithPrices, setIsWithPrices] = useState(false)

	function reset() {
		setSelectedLocation('')
		setSelectedGroups(['all'])
		setSelectedTypes(['all'])
		setIsSummarized(false)
		const today = new Date()
		setDate({ from: startOfMonth(today), to: endOfMonth(today) })
	}

	function onOpenChange(open: boolean) {
		setOpen(open)
		reset()
	}

	function fetchLocations(customerID: CustomerID) {
		startTransition(async () => {
			const res = await fetchLocationsForCustomerActions({
				customerID: customerID,
			})
			setLocations(res?.data ?? [])
		})
	}

	function fetchItemGroups(customerID: CustomerID) {
		startTransition(async () => {
			const res = await fetchItemGroupsForCustomerActions({
				customerID: customerID,
			})
			const allOption: Option = {
				value: 'all',
				label: t('inventory-sum-report.item-group-all-label'),
				disabled: false,
			}

			if (res && res.data) {
				setItemGroups([allOption, ...res.data])
			}
		})
	}

	function onSubmit() {
		if (
			!selectedLocation ||
			!user ||
			!date?.from ||
			!date?.to ||
			selectedGroups.length == 0 ||
			selectedTypes.length == 0
		) {
			return
		}

		startTransition(async () => {
			const cleanedDate = { from: date.from!, to: date.to! }
			const res = await genInventoryMovementsReportAction({
				locationID: selectedLocation,
				itemGroup: selectedGroups,
				dateRange: cleanedDate,
				type: selectedTypes,
			})

			if (res && res.data) {
				const { customer, location, history } = res.data

				if (history.length == 0) {
					toast.error(t('inventory-sum-report.error-toast'), {
						description: t('inventory-sum-report.error-toast-desc'),
					})
					return
				}

				const today = new Date()

				switch (fileType) {
					case 'pdf':
						const meta = {
							docTitle: `Lagerbevægelser for ${customer?.company}`,
							companyName: customer.company,
							locationName: location.name,
							userName: user.name,
							dateOfReport: today,
						}
						const pdf = genSummarizedReportPDF(
							meta,
							history,
							isSummarized,
							isWithPrices,
							selectedGroups.join(', '),
							{ from: date.from!, to: date.to! },
							selectedTypes
								.map(v => v.slice(0, 1).toUpperCase() + v.slice(1))
								.join(', '),
							t,
						)
						pdf.save(
							`lagerbevægelses-rapport-${location.name}-${formatDate(today, false)}.pdf`,
						)
						return
					case 'excel':
						const workbook = genInventoryMovementsExcel(
							history,
							isSummarized,
							isWithPrices,
							t,
						)
						XLSX.writeFile(
							workbook,
							`lagerbevægelses-rapport-${location.name}-${formatDate(today, false)}.xlsx`,
						)
						return
				}
			}
		})
	}

	useEffect(() => {
		if (locations.length == 0 && user) {
			fetchLocations(user.customerID)
		}

		if (itemGroups.length == 0 && user) {
			fetchItemGroups(user.customerID)
		}
	}, [])

	const submitDisabled =
		pending ||
		locations.length == 0 ||
		!selectedLocation ||
		itemGroups.length == 0 ||
		selectedGroups.length == 0 ||
		selectedTypes.length == 0
	const submitPending =
		pending && locations.length > 0 && selectedLocation && itemGroups.length > 0

	const historyOptions = [
		{
			value: 'all',
			label: t('inventory-sum-report.item-group-all-label'),
			disabled: false,
		},
	]
	historyTypes.map(t =>
		historyOptions.push({
			label: t,
			value: t,
			disabled: false,
		}),
	)

	return (
		<DialogV2 open={open} onOpenChange={onOpenChange}>
			<DialogTriggerV2 asChild>
				<Button variant='outline'>Download</Button>
			</DialogTriggerV2>
			<DialogContentV2 className='md:max-w-3xl'>
				<DialogHeaderV2>
					<DialogTitleV2>{t('inventory-sum-report.title')}</DialogTitleV2>
				</DialogHeaderV2>
				<div className='px-3 space-y-4'>
					<DialogDescriptionV2>
						{t('inventory-sum-report.desc')}
					</DialogDescriptionV2>
					<div className='flex flex-col md:flex-row gap-8'>
						<div className='flex flex-col gap-4 md:w-1/2'>
							<div className='grid gap-2'>
								<Label>{t('inventory-sum-report.location-label')}</Label>
								<Select
									value={selectedLocation}
									onValueChange={val => setSelectedLocation(val)}>
									<SelectTrigger>
										{locations.length > 0 ? (
											<SelectValue
												placeholder={t('inventory-sum-report.choose-location')}
												defaultValue={selectedLocation}
											/>
										) : (
											<SelectValue
												placeholder={t('inventory-sum-report.loading-location')}
												defaultValue={selectedLocation}
											/>
										)}
									</SelectTrigger>
									<SelectContent>
										{locations.map((l, i) => (
											<SelectItem key={i} value={l.id}>
												{l.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className='grid gap-2'>
								<Label>{t('inventory-sum-report.item-group-label')}</Label>
								<MultiSelect
									disabled={pending}
									options={itemGroups}
									selected={selectedGroups}
									onChange={val => {
										const allIndex = val.findIndex(v => v == 'all')
										if (val.length > 1 && allIndex == 0) {
											setSelectedGroups(val.filter(v => v != 'all'))
										} else if (allIndex != -1) {
											setSelectedGroups(['all'])
										} else {
											setSelectedGroups(val)
										}
									}}
									placeholder={t('inventory-sum-report.loading-item-group')}
									searchPlaceholder={t(
										'inventory-sum-report.loading-item-group',
									)}
								/>
							</div>
							<div className='grid gap-2'>
								<Label>{t('inventory-sum-report.type-label')}</Label>
								<MultiSelect
									disabled={pending}
									options={historyOptions}
									selected={selectedTypes}
									onChange={val => {
										const allIndex = val.findIndex(v => v == 'all')
										if (val.length > 1 && allIndex == 0) {
											setSelectedTypes(
												val.filter(v => v != 'all') as HistoryTypeWithAll[],
											)
										} else if (allIndex != -1) {
											setSelectedTypes(['all'])
										} else {
											setSelectedTypes(val as HistoryTypeWithAll[])
										}
									}}
									placeholder={t('inventory-sum-report.loading-item-group')}
									searchPlaceholder={t(
										'inventory-sum-report.loading-item-group',
									)}
								/>
							</div>
							<div className='flex gap-2 items-center'>
								<Checkbox
									id='summarize'
									className='size-5'
									checked={isSummarized}
									onCheckedChange={checked => setIsSummarized(Boolean(checked))}
								/>
								<Label htmlFor='summarize'>
									{t('inventory-sum-report.summed-label')}
								</Label>
							</div>
							<div className='flex gap-2 items-center'>
								<Checkbox
									id='with-prices'
									className='size-5'
									checked={isWithPrices}
									onCheckedChange={checked => setIsWithPrices(Boolean(checked))}
								/>
								<Label htmlFor='with-prices'>
									{t('inventory-sum-report.with-prices-label')}
								</Label>
							</div>
							<div className='grid gap-2'>
								<Label>{t('inventory-sum-report.file-format-label')}</Label>
								<div className='w-full flex'>
									<Button
										onClick={() => setFileType('pdf')}
										className='gap-2 rounded-r-none w-1/2'
										variant={fileType == 'pdf' ? 'default' : 'outline'}
										size='sm'>
										PDF
									</Button>
									<Button
										onClick={() => setFileType('excel')}
										className='gap-2 rounded-l-none w-1/2'
										variant={fileType != 'pdf' ? 'default' : 'outline'}
										size='sm'>
										Excel
									</Button>
								</div>
							</div>
						</div>
						<div className='flex flex-col gap-4 md:w-1/2'>
							<div className='grid gap-2'>
								<Label>{t('inventory-sum-report.timeperiod-label')}</Label>
								{date ? (
									<p className='text-muted-foreground text-sm'>
										{date.from
											? DFNs.formatDate(date.from, 'do MMM yyyy', {
													locale: da,
												})
											: t('inventory-sum-report.choose-date', {
													context: 'from',
												})}{' '}
										-{' '}
										{date.to
											? DFNs.formatDate(date.to, 'do MMM yyyy', { locale: da })
											: t('inventory-sum-report.choose-date', {
													context: 'to',
												})}
									</p>
								) : (
									<p className='text-muted-foreground text-sm'>
										{t('inventory-sum-report.choose-both-dates')}
									</p>
								)}
								<Calendar
									mode='range'
									selected={date}
									onSelect={setDate}
									className='rounded border'
									classNames={{
										month: 'w-full space-y-4',
										head_row: 'justify-around flex',
										day: cn(
											buttonVariants({ variant: 'ghost' }),
											'h-8 w-full p-0 font-normal aria-selected:opacity-100',
										),
									}}
								/>
							</div>
						</div>
					</div>
				</div>
				<DialogFooterV2>
					<Button
						onClick={() => reset()}
						size='sm'
						className='flex items-center gap-2 w-fit self-end'>
						{t('inventory-sum-report.reset-button')}
					</Button>
					<Button
						onClick={() => onSubmit()}
						size='sm'
						className='flex items-center gap-2 w-fit self-end'
						disabled={submitDisabled}>
						{submitPending && <Icons.spinner className='size-4 animate-spin' />}
						{t('inventory-sum-report.download-button')}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}
