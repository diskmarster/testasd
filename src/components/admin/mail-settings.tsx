"use client"

import { CustomerMailSettingWithEmail } from "@/data/customer.types"
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "../ui/card"
import { ScrollArea } from "../ui/scroll-area"
import { Button } from "../ui/button"
import { Icons } from "../ui/icons"
import { cn, formatDate } from "@/lib/utils"
import {
	DialogContentV2,
	DialogDescriptionV2,
	DialogFooterV2,
	DialogHeaderV2,
	DialogTitleV2,
	DialogTriggerV2,
	DialogV2
} from "../ui/dialog-v2"
import { useForm } from "react-hook-form"
import { createMailSetting } from "@/app/[lng]/(site)/administration/firma/validation"
import { zodResolver } from "@hookform/resolvers/zod"
import {
	Dispatch,
	ReactNode,
	SetStateAction,
	useEffect,
	useState,
	useTransition
} from "react"
import { User } from "lucia"
import { UserNoHash } from "@/lib/database/schema/auth"
import { Label } from "../ui/label"
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from "../ui/select"
import { Input } from "../ui/input"
import {
	createMailSettingAction,
	deleteMailSettingAction,
	fetchLocationsForMailSettings,
	fetchUsersAction,
	updateMultipleMailSettings
} from "@/app/[lng]/(site)/administration/firma/actions"
import { toast } from "sonner"
import { siteConfig } from "@/config/site"
import { z } from "zod"
import Link from "next/link"
import { useLanguage } from "@/context/language"
import { emitCustomEvent, useCustomEventListener } from "react-custom-events"
import { useTranslation } from "@/app/i18n/client"

interface Props {
	user: User
	settings: CustomerMailSettingWithEmail[]
}

export function MailSettings({ settings, user }: Props) {
	const lang = useLanguage()
	const { t } = useTranslation(lang, 'organisation')
	const [pending, startTransition] = useTransition()
	const [settingsChanges, setSettingsChanges] = useState(new Map<number, Partial<CustomerMailSettingWithEmail>>())
	const hasChanges = settingsChanges.size > 0
	const [localSettings, setLocalSettings] = useState(settings);

	function updateMailSettings() {
		let payload = []
		for (const [key, val] of Array.from(settingsChanges.entries())) {
			payload.push({ id: key, ...val })
		}

		const previousSettings = [...localSettings]

		startTransition(async () => {
			const res = await updateMultipleMailSettings(payload)

			if (res && res.serverError) {
				setLocalSettings(previousSettings)
				toast.error(t(siteConfig.errorTitle), {
					description: res.serverError
				})
				return
			}

			let toaster = res?.data?.fullUpdate
				? toast.success
				: toast.warning

			let msg = res?.data?.fullUpdate
				? t('mail-settings.errors.update-settings-success')
				: t('mail-settings.errors.update-settings-failed', { count: (res?.data?.ids.length || 0), max: payload.length })

			const newMap = new Map()
			const updatedSettings = localSettings.map(setting => {
				const hasChange = settingsChanges.get(setting.id)
				const wasUpdated = res?.data?.ids.includes(setting.id)
				if (hasChange && !wasUpdated) newMap.set(setting.id, hasChange)
				return (hasChange && wasUpdated) ? { ...setting, ...hasChange } : setting
			})

			setLocalSettings(updatedSettings)
			setSettingsChanges(newMap)
			toaster(t(siteConfig.successTitle), { description: msg })
		})
	}

	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between">
				<div className="space-y-1.5">
					<CardTitle>{t('mail-settings.title')}</CardTitle>
					<CardDescription>{t('mail-settings.description')}</CardDescription>
				</div>
				<div className="flex items-center gap-4">
					<Link
						className="hover:underline text-sm text-muted-foreground"
						href={`/${lang}/faq/?spørgsmål=Hvilke mails jeg få tilsendt?`}
					>
						{t('mail-settings.link-to-faq')}
					</Link>
					{hasChanges ? (
						<div className="flex items-center gap-2">
							<Button variant='outline' onClick={() => {
								const newMap = new Map()
								setSettingsChanges(newMap)
							}}>
								{t('mail-settings.button-cancel')}
							</Button>
							<Button
								onClick={() => updateMailSettings()}
								className="flex items-center gap-2">
								{pending && <Icons.spinner className="size-4 animate-spin" />}
								{t('mail-settings.button-apply', { count: settingsChanges.size })}
							</Button>
						</div>
					) : (
						<CreateMailSetting user={user} />
					)}
				</div>
			</CardHeader>
			<CardContent>
				<EmailList settings={localSettings} changes={settingsChanges} setChanges={setSettingsChanges} />
			</CardContent>
		</Card>
	)
}

function EmailList({
	settings,
	changes,
	setChanges,
}: {
	settings: CustomerMailSettingWithEmail[],
	changes: Map<number, Partial<CustomerMailSettingWithEmail>>,
	setChanges: Dispatch<SetStateAction<Map<number, Partial<CustomerMailSettingWithEmail>>>>
}) {
	const lang = useLanguage()
	const { t } = useTranslation(lang, 'organisation')
	const [limit, setLimit] = useState(10)
	// TODO: remember small screens
	const layoutClasses = "px-3 grid gap-2 grid-cols-[150px_100px_1fr_100px_50px] items-center"
	return (
		<div className="flex flex-col gap-2">
			<SettingsHeader layoutClasses={layoutClasses} />
			<ScrollArea>
				<div className="flex flex-col gap-1">
					{settings.slice(0, limit).map(s => (
						<SingleSetting
							key={s.id}
							layoutClasses={layoutClasses}
							setting={s}
							changes={changes}
							setChanges={setChanges} />
					))}
				</div>
			</ScrollArea>
			{limit < settings.length && (
				<Button
					size='sm'
					className="mx-auto"
					onClick={() => setLimit(settings.length)}
				>
					{t('mail-settings.button-show-all')}
				</Button>
			)}
		</div>
	)
}

function SettingsHeader({ layoutClasses }: { layoutClasses: string }) {
	const lang = useLanguage()
	const { t } = useTranslation(lang, 'organisation')
	return (
		<div className={cn(layoutClasses, "py-2 rounded-md bg-muted text-muted-foreground text-xs font-semibold")}>
			<p>{t('mail-settings.col-updated')}</p>
			<p>{t('mail-settings.col-location')}</p>
			<p>{t('mail-settings.col-email')}</p>
			<p className="text-center">{t('mail-settings.col-stock-value')}</p>
			<div />
		</div>
	)
}

function SingleSetting({
	layoutClasses,
	setting,
	changes,
	setChanges,
}: {
	layoutClasses: string,
	setting: CustomerMailSettingWithEmail,
	changes: Map<number, Partial<CustomerMailSettingWithEmail>>,
	setChanges: Dispatch<SetStateAction<Map<number, Partial<CustomerMailSettingWithEmail>>>>
}) {
	const hasChange = changes.get(setting.id)

	function update(key: number, val: Partial<CustomerMailSettingWithEmail>) {
		const newMap = new Map(changes)
		if (newMap.has(key)) {
			newMap.delete(key)
		} else {
			const existing = newMap.get(key)
			newMap.set(key, { ...existing, ...val })
		}
		setChanges(newMap)
	}
	return (
		<article className={cn(layoutClasses, "text-sm")}>
			<p>{formatDate(setting.updated)}</p>
			<p>{setting.locationName}</p>
			<p>{setting.userID ? setting.userEmail : setting.email}</p>
			<div
				className="mx-auto hover:[&>*]:text-amber-900 hover:[&>*]:border-amber-900 cursor-pointer"
				onClick={() => update(setting.id, { ...setting, sendStockMail: !setting.sendStockMail })}>
				{hasChange
					? hasChange.sendStockMail
						? <Icons.dashedCheck />
						: <Icons.circleDashed className="size-5 text-amber-500" />
					: setting.sendStockMail
						? <Icons.circleCheck className="size-5 text-success" />
						: <Icons.circle className="size-5" />
				}
			</div>
			<div className="ml-auto">
				<SingleSettingActions setting={setting} />
			</div>
		</article>
	)
}

function SingleSettingActions({
	setting,
}: {
	setting: CustomerMailSettingWithEmail,
}) {
	return (
		<Button
			size='iconSm'
			variant='ghost'
			className="group"
			onClick={() => emitCustomEvent('DeleteMailSettingByID', { id: setting.id })}
		>
			<Icons.cross className="size-4 text-muted-foreground group-hover:text-destructive" />
		</Button>
	)
}

export function DeleteSettingModal() {
	// rendered in page.tsx
	const lang = useLanguage()
	const { t } = useTranslation(lang, 'organisation')
	const [pending, startTransition] = useTransition()
	const [open, setOpen] = useState(false)
	const [settingID, setSettingID] = useState<number>()

	useCustomEventListener('DeleteMailSettingByID', ({ id }: { id: number }) => {
		setSettingID(id)
		setOpen(true)
	})

	function onOpenChange(open: boolean) {
		setOpen(open)
		setSettingID(undefined)
	}

	function deleteSetting() {
		if (!settingID) {
			toast.error(t(siteConfig.errorTitle), {
				description: t('mail-settings.errors.delete-setting-failed')
			})
			return
		}
		startTransition(async () => {
			const res = await deleteMailSettingAction({ settingID })
			if (res && res.serverError) {
				toast.error(t(siteConfig.errorTitle), {
					description: res.serverError
				})
				return
			}
			toast.success(t(siteConfig.successTitle), {
				description: t('mail-settings.errors.delete-setting-success')
			})
			onOpenChange(false)
		})
	}

	return (
		<DialogV2 open={open} onOpenChange={onOpenChange}>
			<DialogContentV2 className="max-w-md">
				<DialogHeaderV2>
					<div className="flex items-center gap-2">
						<Icons.trash className="size-4 text-destructive" />
						<DialogTitleV2 className="text-sm">{t('mail-settings.delete-modal.title')}</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<div className="px-3 space-y-4">
					<DialogDescriptionV2>{t('mail-settings.delete-modal.description')}</DialogDescriptionV2>
				</div>
				<DialogFooterV2>
					<Button
						onClick={() => onOpenChange(false)}
						size='sm'
						variant='outline'>
						{t('mail-settings.delete-modal.button-no')}
					</Button>
					<Button
						size='sm'
						form="create-form"
						type="submit"
						className="flex items-center gap-2"
						onClick={() => deleteSetting()}
						variant='destructive'>
						{pending && (
							<Icons.spinner className="size-3.5 animate-spin" />
						)}
						{t('mail-settings.delete-modal.button-yes')}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}

function CreateMailSetting({ user }: { user: User }) {
	const lang = useLanguage()
	const { t } = useTranslation(lang, 'organisation')
	const [open, setOpen] = useState(false)
	const [pending, startTransition] = useTransition()
	const [locations, setLocations] = useState<{ id: string; name: string }[]>([])
	const [users, setUsers] = useState<UserNoHash[]>([])
	const [search, setSearch] = useState('')

	const filteredUsers = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()))
	const userMap = new Map(users.map(u => [u.email, u.id]))

	const { setValue, watch, reset, handleSubmit, formState: { isValid, isDirty } } = useForm<z.infer<typeof createMailSetting>>({
		resolver: zodResolver(createMailSetting),
		defaultValues: {
			mails: {
				sendStockMail: false
			},
			email: null,
			userID: null,
			locationID: undefined
		},
		mode: 'onChange'
	})

	const fv = watch()

	useEffect(() => {
		if (!pending && locations.length == 0) {
			startTransition(async () => {
				const res = await fetchLocationsForMailSettings({
					customerID: user.customerID,
				})
				setLocations(res?.data ?? [])
			})
		}

		if (!pending && users.length == 0) {
			startTransition(async () => {
				const res = await fetchUsersAction()
				if (res && res.data) {
					setUsers(res.data)
				}
			})
		}
	}, [])

	function onOpenChange(open: boolean) {
		setOpen(open)
		reset()
		setSearch('')
	}

	function hasMailsSelected(): boolean {
		let hasSelected = false
		for (const key of Object.keys(fv.mails)) {
			if (fv.mails[key as (keyof typeof fv.mails)]) {
				hasSelected = true
			}
		}
		return hasSelected
	}

	useEffect(() => {
		const user = userMap.get(search)
		if (user) {
			setValue('userID', user, { shouldValidate: true, shouldDirty: true })
			setValue('email', null, { shouldValidate: true, shouldDirty: true })
		} else {
			setValue('userID', null, { shouldValidate: true, shouldDirty: true })
			setValue('email', search, { shouldValidate: true, shouldDirty: true })
		}
	}, [search])

	function onSubmit(values: z.infer<typeof createMailSetting>) {
		startTransition(async () => {
			const res = await createMailSettingAction(values)
			if (res && res.serverError) {
				toast.error(t(siteConfig.successTitle), {
					description: res.serverError
				})
				return
			}
			toast.success(t(siteConfig.successTitle), {
				description: t('mail-settings.errors.create-settings-success')
			})
			onOpenChange(false)
		})
	}

	return (
		<DialogV2 open={open} onOpenChange={onOpenChange}>
			<DialogTriggerV2 asChild>
				<Button>{t('mail-settings.button-add')}</Button>
			</DialogTriggerV2>
			<DialogContentV2 className="max-w-md">
				<DialogHeaderV2>
					<div className="flex gap-2 items-center">
						<Icons.plus className="size-4 text-primary" />
						<DialogTitleV2>{t('mail-settings.add-modal.title')}</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<div className="px-3 flex flex-col gap-4">
					<form
						onSubmit={handleSubmit(onSubmit)}
						id="create-mail-setting"
						className="space-y-4">
						<div className="grid gap-2">
							<Label>{t('mail-settings.add-modal.type')}</Label>
							{(isDirty && !hasMailsSelected()) && (
								<p className="text-sm text-destructive">{t('mail-settings.add-modal.type-error-message')}</p>
							)}
							<div className="grid grid-cols-2 gap-2">
								<MailTypeCard
									icon={<Icons.fileDigit className="size-4 text-muted-foreground" />}
									title={t('mail-settings.add-modal.mail-types.stock-value-title')}
									description={t('mail-settings.add-modal.mail-types.stock-value-description')}
									selected={fv.mails.sendStockMail}
									onClick={() => setValue('mails.sendStockMail', !fv.mails.sendStockMail, { shouldValidate: true, shouldDirty: true })}
								/>
							</div>
						</div>
						<div className="grid gap-2">
							<Label>{t('mail-settings.add-modal.locations')}</Label>
							<Select
								onValueChange={val => setValue('locationID', val, { shouldValidate: true, shouldDirty: true })}
								disabled={pending && users.length == 0}>
								<SelectTrigger>
									<SelectValue placeholder={t('mail-settings.add-modal.locations-placeholder')} />
								</SelectTrigger>
								<SelectContent>
									{locations.map(l => (
										<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-2">
							<Label>{t('mail-settings.add-modal.email')}</Label>
							<div>
								<Input
									list="users"
									value={search}
									onChange={event => setSearch(event.target.value)}
									placeholder="Skriv e-mail"
									className="shadow-none rounded-b-none"
								/>
								<ScrollArea
									maxHeight="max-h-36"
									className={cn("rounded-b-md border-x border-b border-t-0 bg-background")}>
									{filteredUsers.length == 0 && (
										<p className="text-sm px-3 py-2 text-muted-foreground">{t('mail-settings.add-modal.email-external-mail')}</p>
									)}
									{filteredUsers.map(u => (
										<UserCard
											key={u.id}
											user={u} onClick={() => setSearch(u.email)}
											selected={search == u.email}
										/>
									))}
								</ScrollArea>
							</div>
						</div>
					</form>
				</div>
				<DialogFooterV2>
					<Button
						size="sm"
						variant="outline"
						onClick={() => onOpenChange(false)}>
						{t('mail-settings.add-modal.button-close')}
					</Button>
					<Button
						disabled={!isValid || (pending && users.length > 0 && locations.length > 0)}
						type="submit"
						form="create-mail-setting"
						className="flex items-center gap-2"
						size="sm">
						{pending && <Icons.spinner className="size-4 animate-spin" />}
						{t('mail-settings.add-modal.button-confirm')}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2 >
	)
}

interface UserCardProps extends React.HTMLAttributes<HTMLDivElement> {
	user: UserNoHash
	selected: boolean
}

function UserCard({ user, selected, className, ...props }: UserCardProps) {
	return (
		<div
			{...props}
			className={cn(
				"flex items-center justify-between px-3 py-1 rounded-none",
				"cursor-pointer hover:bg-muted",
				className
			)}
		>
			<div className="flex flex-col">
				<p className="text-sm font-medium">{user.name}</p>
				<p className="text-xs text-muted-foreground">{user.email}</p>
			</div>
			{selected && <Icons.circleCheck className="size-4 text-primary" />}
		</div>
	)
}

interface MailTypeCardProps extends React.HTMLAttributes<HTMLDivElement> {
	icon: ReactNode
	title: string
	description: string
	selected: boolean
}

function MailTypeCard({ icon, title, description, selected, className, ...props }: MailTypeCardProps) {
	return (
		<div className={cn(
			"flex flex-col gap-1 border rounded-md p-2 transition-all cursor-pointer",
			"hover:border-primary",
			selected && "bg-muted border-primary/50",
			className
		)}
			{...props}>
			<div className="flex items-center justify-between">
				{icon}
				{selected && <Icons.circleCheck className="size-4 text-primary" />}
			</div>
			<div className="flex flex-col">
				<p className="text-sm font-medium">{title}</p>
				<small className="text-muted-foreground text-xs">{description}</small>
			</div>
		</div>
	)
}
