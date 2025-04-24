'use client'

import * as DFNs from 'date-fns'
import { fetchItemGroupsForCustomerActions, fetchLocationsForCustomerActions } from '@/app/[lng]/(site)/sys/kunder/actions'
import { genInventoryMovementsReportAction } from '@/app/actions'
import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { useSession } from '@/context/session'
import { CustomerID } from '@/lib/database/schema/customer'
import { cn, formatDate } from '@/lib/utils'
import { useEffect, useState, useTransition } from 'react'
import { Button, buttonVariants } from '../ui/button'
import { Icons } from '../ui/icons'
import { Label } from '../ui/label'
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '../ui/select'
import * as XLSX from 'xlsx'
import { DialogContentV2, DialogDescriptionV2, DialogFooterV2, DialogHeaderV2, DialogTitleV2, DialogTriggerV2, DialogV2 } from '../ui/dialog-v2'
import { Calendar } from '../ui/calendar'
import { DateRange } from 'react-day-picker'
import { endOfMonth, startOfMonth } from 'date-fns'
import { Checkbox } from '../ui/checkbox'
import { genInventoryMovementsExcel, genSummarizedReportPDF } from '@/lib/pdf/inventory-movements-rapport'
import { da } from 'date-fns/locale'
import { HistoryType, historyTypes } from '@/data/inventory.types'

type HistoryTypeWithAll = HistoryType | 'all'

export function ModalSumReport() {
	const [pending, startTransition] = useTransition()
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'rapporter')
	const { user } = useSession()
	const [locations, setLocations] = useState<{ id: string; name: string }[]>([])
	const [selectedLocation, setSelectedLocation] = useState<string>()
	const [itemGroups, setItemGroups] = useState<{ id: number; name: string }[]>([])
	const [selectedItemGroup, setSelectedItemGroup] = useState<string>('all')
	const [selectedMovementType, setSelectedMovementType] = useState<HistoryTypeWithAll>('all')
	const [open, setOpen] = useState(false)
	const [fileType, setFileType] = useState<'pdf' | 'excel'>('pdf')
	const [date, setDate] = useState<DateRange | undefined>({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })
	const [isSummarized, setIsSummarized] = useState(false)

	function onOpenChange(open: boolean) {
		setOpen(open)
		setSelectedLocation(undefined)
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
			setItemGroups(res?.data ?? [])
		})
	}

	function onSubmit() {
		if (
			!selectedLocation ||
			!user ||
			!selectedItemGroup ||
			!selectedMovementType ||
			!date?.from ||
			!date?.to
		) {
			return
		}

		startTransition(async () => {
			const cleanedDate = { from: date.from!, to: date.to! }
			const res = await genInventoryMovementsReportAction({
				locationID: selectedLocation,
				itemGroup: selectedItemGroup,
				dateRange: cleanedDate,
				type: selectedMovementType
			})

			if (res && res.data) {
				const { customer, location, history } = res.data
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
							selectedItemGroup,
							{ from: date.from!, to: date.to! },
							selectedMovementType,
							t
						)
						pdf.save(`lagerbevægelses-rapport-${location.name}-${formatDate(today, false)}.pdf`)
						return
					case 'excel':
						const workbook = genInventoryMovementsExcel(history, isSummarized, t)
						XLSX.writeFile(workbook, `lagerbevægelses-rapport-${location.name}-${formatDate(today, false)}.xlsx`)
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

	const submitDisabled = pending || locations.length == 0 || !selectedLocation || itemGroups.length == 0 || !selectedItemGroup
	const submitPending = pending && locations.length > 0 && selectedLocation && itemGroups.length > 0 && selectedItemGroup

	return (
		<DialogV2 open={open} onOpenChange={onOpenChange}>
			<DialogTriggerV2 asChild>
				<Button variant='outline'>Download</Button>
			</DialogTriggerV2>
			<DialogContentV2 className='max-w-3xl'>
				<DialogHeaderV2>
					<DialogTitleV2>{t('inventory-sum-report.title')}</DialogTitleV2>
				</DialogHeaderV2>
				<div className='px-3 space-y-4'>
					<DialogDescriptionV2>
						{t('inventory-sum-report.desc')}
					</DialogDescriptionV2>
					<div className='flex gap-8'>
						<div className='flex flex-col gap-4 w-1/2'>
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
								<Select
									value={selectedItemGroup}
									onValueChange={val => setSelectedItemGroup(val)}>
									<SelectTrigger>
										{itemGroups.length > 0 ? (
											<SelectValue
												placeholder={t('inventory-sum-report.choose-item-group')}
												defaultValue={selectedItemGroup}
											/>
										) : (
											<SelectValue
												placeholder={t('inventory-sum-report.loading-item-group')}
												defaultValue={selectedItemGroup}
											/>
										)}
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											{t('inventory-sum-report.item-group-all-label')}
										</SelectItem>
										{itemGroups.map((l, i) => (
											<SelectItem key={i} value={l.name}>
												{l.name}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className='grid gap-2'>
								<Label>{t('inventory-sum-report.type-label')}</Label>
								<Select
									value={selectedMovementType}
									onValueChange={val => setSelectedMovementType(val as HistoryTypeWithAll)}>
									<SelectTrigger>
										<SelectValue
											placeholder={t('inventory-sum-report.loading-item-group')}
											defaultValue={selectedMovementType}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="all">
											{t('inventory-sum-report.type-all-label')}
										</SelectItem>
										{historyTypes.map((t, i) => (
											<SelectItem key={i} value={t} className='capitalize'>
												{t}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
							<div className='flex gap-2 items-center'>
								<Checkbox id='summarize' className='size-5' checked={isSummarized} onCheckedChange={checked => setIsSummarized(Boolean(checked))} />
								<Label htmlFor='summarize'>{t('inventory-sum-report.summed-label')}</Label>
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
						<div className='flex flex-col gap-4 w-1/2'>
							<div className='grid gap-2'>
								<Label>{t('inventory-sum-report.timeperiod-label')}</Label>
								{date ? (
									<p className='text-muted-foreground text-sm'>
										{date.from ? DFNs.formatDate(date.from, 'do MMM yyyy', { locale: da }) : t("inventory-sum-report.choose-date", { context: "from" })} - {date.to ? DFNs.formatDate(date.to, "do MMM yyyy", { locale: da }) : t("inventory-sum-report.choose-date", { context: "to" })}
									</p>
								) : (
									<p className='text-muted-foreground text-sm'>Vælg en til og fra dato</p>
								)}
								<Calendar
									mode='range'
									selected={date}
									onSelect={setDate}
									className='rounded border'
									classNames={{
										month: "w-full space-y-4",
										head_row: "justify-around flex",
										day: cn(
											buttonVariants({ variant: "ghost" }),
											"h-8 w-full p-0 font-normal aria-selected:opacity-100"
										),
									}}
								/>
							</div>
						</div>
					</div>
				</div>
				<DialogFooterV2>
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
