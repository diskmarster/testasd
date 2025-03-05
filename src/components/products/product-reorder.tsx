"use client"

import { Reorder } from "@/lib/database/schema/inventory"
import { cn } from "@/lib/utils"
import { User } from "lucia"
import { Button } from "../ui/button"
import { useState, useTransition } from "react"
import { useLanguage } from "@/context/language"
import { useTranslation } from "@/app/i18n/client"
import { Label } from "../ui/label"
import { IfElse } from "../common/if-else"
import { Input } from "../ui/input"

interface Props {
	reorder: Reorder | undefined
	user: User
}

export function ProductReorder({ user, reorder }: Props) {
	const [pending, startTransition] = useTransition()
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter')
	const [isEditing, setIsEditing] = useState(false)
	return (
		<div className="lg:w-1/2 border rounded-md relative">
			<div className={cn('hidden bg-foreground/10 w-full h-full absolute rounded-md place-items-center', !reorder && 'grid')}>
				<div className="flex flex-col gap-2.5 items-center p-4 bg-background rounded-md shadow-md">
					<p className="text-sm">Der er ingen genbestil på denne vare</p>
					<Button className="w-fit" size='sm' onClick={() => setIsEditing(true)}>Opret genbestil</Button>
				</div>
			</div>
			<div className="p-4 flex flex-col gap-4 ">
				<div>
					<p className="font-medium">{t('details-page.reorder.title')}</p>
					<p className="text-muted-foreground text-sm">{t('details-page.reorder.description')}</p>
				</div>
				<div className="space-y-0.5 w-full">
					<Label htmlFor="minimum">{t('details-page.reorder.label-minimum')}</Label>
					<IfElse
						condition={isEditing}
						falseComp={<div className="h-9 px-3 flex items-center border rounded-md bg-muted/50 text-sm">{reorder?.minimum}</div>}
						trueComp={
							<Input
								id="text1"
								name="text1"
								value={reorder?.minimum}
							//onChange={event => setValue('data.text1', event.target.value, { shouldValidate: true })}
							/>
						}
					/>
				</div>
				<div className="space-y-0.5 w-full">
					<Label htmlFor="orderAmount">{t('details-page.reorder.label-orderAmount')}</Label>
					<IfElse
						condition={isEditing}
						falseComp={<div className="h-9 px-3 flex items-center border rounded-md bg-muted/50 text-sm">{reorder?.orderAmount}</div>}
						trueComp={
							<Input
								id="text1"
								name="text1"
								value={reorder?.orderAmount}
							//onChange={event => setValue('data.text1', event.target.value, { shouldValidate: true })}
							/>
						}
					/>
				</div>
				<div className="space-y-0.5 w-full">
					<Label htmlFor="maxOrderAmount">{t('details-page.reorder.label-maxOrderAmount')}</Label>
					<IfElse
						condition={isEditing}
						falseComp={<div className="h-9 px-3 flex items-center border rounded-md bg-muted/50 text-sm">{reorder?.maxOrderAmount}</div>}
						trueComp={
							<Input
								id="text1"
								name="text1"
								value={reorder?.maxOrderAmount}
							//onChange={event => setValue('data.text1', event.target.value, { shouldValidate: true })}
							/>
						}
					/>
				</div>
				<div>
					<Button>Opdater</Button>
				</div>
			</div>
		</div>
	)
}
