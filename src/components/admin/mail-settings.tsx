"use client"

import { CustomerMailSettingWithEmail } from "@/data/customer.types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card"
import { ScrollArea } from "../ui/scroll-area"
import { Button } from "../ui/button"
import { Icons } from "../ui/icons"
import { cn, formatDate } from "@/lib/utils"
import { DialogContentV2, DialogFooterV2, DialogHeaderV2, DialogTitleV2, DialogTriggerV2, DialogV2 } from "../ui/dialog-v2"
import { useForm } from "react-hook-form"
import { createMailSetting } from "@/app/[lng]/(site)/administration/firma/validation"
import { zodResolver } from "@hookform/resolvers/zod"
import { ReactNode, useEffect, useState, useTransition } from "react"
import { fetchLocationsForCustomerActions } from "@/app/[lng]/(site)/sys/kunder/actions"
import { User } from "lucia"
import { fetchUsersAction } from "@/app/[lng]/(site)/genbestil/[id]/actions"
import { UserNoHash } from "@/lib/database/schema/auth"
import { Label } from "../ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select"
import { Input } from "../ui/input"
import { createMailSettingAction } from "@/app/[lng]/(site)/administration/firma/actions"
import { toast } from "sonner"
import { siteConfig } from "@/config/site"
import { z } from "zod"

interface Props {
	user: User
	settings: CustomerMailSettingWithEmail[]
}

export function MailSettings({ settings, user }: Props) {
	return (
		<Card>
			<CardHeader className="flex flex-row items-start justify-between">
				<div className="space-y-1.5">
					<CardTitle>Mailindstillinger</CardTitle>
					<CardDescription>Se og opdater dine mailindstillinger.</CardDescription>
				</div>
				<div className="flex items-center gap-4">
					<div className="text-sm leading-none text-muted-foreground hover:underline cursor-pointer">
						Hvilke mails kan jeg få sendt?
					</div>
					<CreateMailSetting user={user} />
				</div>
			</CardHeader>
			<CardContent>
				<EmailList settings={settings} />
			</CardContent>
		</Card>
	)
}

function EmailList({ settings }: { settings: CustomerMailSettingWithEmail[] }) {
	// TODO: remember small screens
	const layoutClasses = "px-3 grid gap-2 grid-cols-[150px_100px_1fr_100px_130px_50px] items-center"
	return (
		<div className="space-y-2">
			<SettingsHeader layoutClasses={layoutClasses} />
			<ScrollArea>
				<div>
					{settings.map(s => (
						<SingleSetting key={s.id} layoutClasses={layoutClasses} setting={s} />
					))}
				</div>
			</ScrollArea>
		</div>
	)
}

function SettingsHeader({ layoutClasses }: { layoutClasses: string }) {
	return (
		<div className={cn(layoutClasses, "py-2 rounded-md bg-muted text-muted-foreground text-xs font-semibold")}>
			<p>Opdateret</p>
			<p>Lokation</p>
			<p>Email</p>
			<p className="text-right">Lagerværdi</p>
			<p className="text-right">Registreringer (snart)</p>
			<div />
		</div>
	)
}

function SingleSetting({ layoutClasses, setting }: { layoutClasses: string, setting: CustomerMailSettingWithEmail }) {
	return (
		<article className={cn(layoutClasses, "text-sm py-1.5")}>
			<p>{formatDate(setting.updated)}</p>
			<p>{setting.locationName}</p>
			<p>{setting.userID ? setting.userEmail : setting.email}</p>
			<div className="ml-auto">
				{setting.sendStockMail ? <Icons.circleCheck className="size-4 text-success" /> : <Icons.circle className="size-4" />}
			</div>
			<div className="ml-auto">
				<Icons.circle className="size-4 text-muted-foreground" />
			</div>
			<div className="ml-auto">
				<Icons.horizontalDots className="size-4" />
			</div>
		</article>
	)
}

function CreateMailSetting({ user }: { user: User }) {
	const [open, setOpen] = useState(false)
	const [pending, startTransition] = useTransition()
	const [locations, setLocations] = useState<{ id: string; name: string }[]>([])
	const [users, setUsers] = useState<UserNoHash[]>([])
	const [search, setSearch] = useState('')
	const [error, setError] = useState<string>()

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
				// TODO: make seperate action for this feature
				const res = await fetchLocationsForCustomerActions({
					customerID: user.customerID,
				})
				setLocations(res?.data ?? [])
			})
		}

		if (!pending && users.length == 0) {
			startTransition(async () => {
				// TODO: make seperate action for this feature
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
		setError(undefined)
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
				setError(res.serverError)
				return
			}
			toast.success(siteConfig.successTitle, {
				description: "Mailindstilling er blevet oprettet"
			})
			onOpenChange(false)
		})
	}

	return (
		<DialogV2 open={open} onOpenChange={onOpenChange}>
			<DialogTriggerV2 asChild>
				<Button>Tilføj ny</Button>
			</DialogTriggerV2>
			<DialogContentV2 className="max-w-md">
				<DialogHeaderV2>
					<div className="flex gap-2 items-center">
						<Icons.plus className="size-4 text-primary" />
						<DialogTitleV2>Tilføj ny mailindstilling</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<div className="px-3 flex flex-col gap-4">
					<form
						onSubmit={handleSubmit(onSubmit)}
						id="create-mail-setting"
						className="space-y-4">
						<div className="grid gap-2">
							<Label>Hvilke mails skal sendes?</Label>
							{(isDirty && !hasMailsSelected()) && (
								<p className="text-sm text-destructive">Du skal mindst vælge én mail som skal sendes</p>
							)}
							<div className="grid grid-cols-2 gap-2">
								<MailTypeCard
									icon={<Icons.fileDigit className="size-4 text-muted-foreground" />}
									title="Lagerværdi"
									description="Sendes i slutningen af måneden"
									selected={fv.mails.sendStockMail}
									onClick={() => setValue('mails.sendStockMail', !fv.mails.sendStockMail, { shouldValidate: true, shouldDirty: true })}
								/>
							</div>
						</div>
						<div className="grid gap-2">
							<Label>For hvilken lokation?</Label>
							<Select
								onValueChange={val => setValue('locationID', val, { shouldValidate: true, shouldDirty: true })}
								disabled={pending && users.length == 0}>
								<SelectTrigger>
									<SelectValue placeholder="Vælg lokation" />
								</SelectTrigger>
								<SelectContent>
									{locations.map(l => (
										<SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
						<div className="grid gap-2">
							<Label>Til hvilken mail?</Label>
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
										<p className="text-sm">Sender til mail uden for NemLager</p>
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
						Luk
					</Button>
					<Button
						disabled={!isValid || (pending && users.length > 0 && locations.length > 0)}
						type="submit"
						form="create-mail-setting"
						size="sm">
						Tilføj
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
				<p className="text-sm text-muted-foreground">{user.email}</p>
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
