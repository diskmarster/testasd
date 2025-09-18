'use client'

import { toggleCanUseIntegrationsAction } from '@/app/[lng]/(site)/sys/kunder/actions'
import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { CustomerID } from '@/lib/database/schema/customer'
import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import { useCustomEventListener } from 'react-custom-events'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import {
	DialogContentV2,
	DialogFooterV2,
	DialogHeaderV2,
	DialogTitleV2,
	DialogV2,
} from '../ui/dialog-v2'
import { Icons } from '../ui/icons'

type ToggleEvent = {
	customerID: CustomerID
	canUseIntegration: boolean
}

export function ToggleIntegrationModal() {
	const router = useRouter()
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'kunder')
	const [customerID, setCustomerID] = useState<CustomerID>(-1)
	const [canUseIntegration, setCanUseIntegration] = useState<boolean>()
	const [open, setOpen] = useState(false)
	const [pending, startTransition] = useTransition()

	useCustomEventListener('ToggleCanUseIntegrationByID', (data: ToggleEvent) => {
		setCustomerID(data.customerID)
		setCanUseIntegration(data.canUseIntegration)
		setOpen(true)
	})

	function onSubmit() {
		startTransition(async () => {
			const res = await toggleCanUseIntegrationsAction({ customerID })
			if (res && res.serverError) {
				toast.error(t('common:site-config.error-title'), {
					description: res.serverError,
				})
				return
			}

			toast.success(t('common:site-config.success-title'), {
				description: canUseIntegration
					? 'Integrationer slået fra'
					: 'Integrationer slået til',
			})
			onOpenChange(false)
			router.refresh()
		})
	}

	function onOpenChange(open: boolean) {
		setOpen(open)
		setCustomerID(-1)
	}

	return (
		<DialogV2 open={open} onOpenChange={onOpenChange}>
			<DialogContentV2 className='max-w-prose'>
				<DialogHeaderV2>
					<div className='flex items-center gap-2'>
						<Icons.pencil className='size-4 text-primary' />
						<DialogTitleV2>
							{canUseIntegration
								? 'Slå integrationer fra'
								: 'Slå integrationer til'}
						</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<div className='px-3 tabular-nums tracking-tight space-y-4'>
					{canUseIntegration ? (
						<>
							<p>
								Inden du slår integrationer fra for en kunde, skal du sørge for
								at integrationerne er slået fra hos kunden.
							</p>
							<p>Vil du opdatere?</p>
						</>
					) : (
						<>
							<p>
								Når du slår integrationer til for en kunde, får de adgang til
								integrationspanelet på deres firma indstillingsside. Her kan de
								sætte deres integrationer op.{' '}
								<span className='font-bold'>
									Slå kun integrationer til for kunder der har betalt for dette.
								</span>
							</p>
							<p>Vil du opdatere?</p>
						</>
					)}
				</div>
				<DialogFooterV2>
					<Button variant={'outline'} onClick={() => onOpenChange(false)}>
						Annuller
					</Button>
					<Button disabled={pending || customerID == -1} onClick={onSubmit}>
						{pending ? 'Opdaterer' : 'Opdater'}
						{pending && <Icons.spinner className='size-4 animate-spin ml-2' />}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}
