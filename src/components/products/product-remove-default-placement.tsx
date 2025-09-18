import { deleteDefaultPlacement } from '@/app/[lng]/(site)/varer/produkter/[id]/actions'
import { useTranslation } from '@/app/i18n/client'
import { useLanguage } from '@/context/language'
import { LocationID } from '@/lib/database/schema/customer'
import {
	Placement,
	PlacementID,
	ProductID,
} from '@/lib/database/schema/inventory'
import {
	Dispatch,
	SetStateAction,
	useMemo,
	useState,
	useTransition,
} from 'react'
import { toast } from 'sonner'
import { Button } from '../ui/button'
import {
	DialogContentV2,
	DialogFooterV2,
	DialogHeaderV2,
	DialogTitleV2,
	DialogTriggerV2,
	DialogV2,
} from '../ui/dialog-v2'
import { Icons } from '../ui/icons'

export function RemoveDefaultPlacementModal({
	defaultPlacementID,
	placements,
	productID,
	locationID,
	setSelectedPlacementID,
}: {
	defaultPlacementID: PlacementID | undefined
	placements: Placement[]
	productID: ProductID
	locationID: LocationID
	setSelectedPlacementID: Dispatch<SetStateAction<string>>
}) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'produkter', {
		keyPrefix: 'details-page.inventory.remove-default-placement-dialog',
	})
	const [open, setOpen] = useState(false)
	const [pending, startTransition] = useTransition()

	const defaultPlacement = useMemo(
		() => placements.find(p => p.id == defaultPlacementID),
		[defaultPlacementID, placements],
	)

	const submit = () => {
		if (defaultPlacementID != undefined) {
			startTransition(async () => {
				const res = await deleteDefaultPlacement({
					productID,
					locationID,
					placementID: defaultPlacementID,
				})

				if (res && res.serverError) {
					console.error(res.serverError)
					toast.error(t('toasts.default-placement-not-removed'))
				} else if (res && res.validationErrors) {
					console.error(res.validationErrors)
					toast.error(t('toasts.default-placement-not-removed'))
				} else if (res) {
					toast.success(t('toasts.default-placement-removed'))
					setSelectedPlacementID('')
					setOpen(false)
				}
			})
		}
	}

	return (
		<DialogV2 open={open} onOpenChange={v => setOpen(v)}>
			{defaultPlacement != undefined && (
				<DialogTriggerV2 asChild>
					<Button
						variant={'outline'}
						size={'icon'}
						className='hover:text-destructive'>
						<Icons.cross className='size-4' />
					</Button>
				</DialogTriggerV2>
			)}
			<DialogContentV2>
				<DialogHeaderV2>
					<div className='flex items-center gap-2'>
						<Icons.trash className='size-4 text-destructive' />
						<DialogTitleV2>{t('title')}</DialogTitleV2>
					</div>
				</DialogHeaderV2>
				<section className='px-4 tracking-tight tabular-nums space-y-3'>
					<p>
						{t('about-to-remove')}{' '}
						<span className='tracking-tighter font-semibold'>
							{defaultPlacement?.name}
						</span>{' '}
						{t('as-default')}. {t('remove-description')}.
					</p>
					<p>{t('continue')}</p>
				</section>
				<DialogFooterV2>
					<Button onClick={() => setOpen(false)} size='sm' variant='outline'>
						{t('no')}
					</Button>
					<Button
						size='sm'
						className='flex items-center gap-2'
						onClick={submit}
						variant='destructive'>
						{pending && <Icons.spinner className='size-3.5 animate-spin' />}
						{t('yes')}
					</Button>
				</DialogFooterV2>
			</DialogContentV2>
		</DialogV2>
	)
}
