'use client'

import {
	Error,
	getLocationInventories,
	moveInventoriesBetweenLocations,
} from '@/app/[lng]/(site)/administration/lokations-flyt/actions'
import { moveBetweenLocationsSchema } from '@/app/[lng]/(site)/administration/lokations-flyt/validation'
import { useTranslation } from '@/app/i18n/client'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { FormattedInventory } from '@/data/inventory.types'
import {
	CustomerSettings,
	LocationWithPrimary,
} from '@/lib/database/schema/customer'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState, useTransition } from 'react'
import { useForm, UseFormReturn } from 'react-hook-form'
import { toast } from 'sonner'
import { z } from 'zod'
import { Button } from '../ui/button'
import { Icons } from '../ui/icons'
import { LocationFields } from './location-fields'
import { LocationAndReference } from './location-select'

namespace LocationMoveClientWrapper {
	export interface Props {
		initialFromLocation: string
		initialFromInventories: FormattedInventory[]
		locations: LocationWithPrimary[]
		customerSettings: CustomerSettings
		useBatch: boolean
	}
}

export type MoveBetweenLocationForm = UseFormReturn<
	z.infer<typeof moveBetweenLocationsSchema>,
	any,
	undefined
>

export function LocationMoveClientWrapper({
	initialFromLocation,
	initialFromInventories,
	locations,
	customerSettings,
	useBatch,
}: LocationMoveClientWrapper.Props) {
	const lang = useLanguage()
	const { t } = useTranslation(lang, 'lokations-flyt', { keyPrefix: 'form' })

	const [_pending, startTransition] = useTransition()
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [inventories, setInventories] = useState(initialFromInventories)
	const [serverErrors, setServerErrors] = useState<Error[]>([])

	const form = useForm<z.infer<typeof moveBetweenLocationsSchema>>({
		mode: 'onChange',
		resolver: zodResolver(moveBetweenLocationsSchema),
		defaultValues: {
			fromLocation: initialFromLocation,
			fields: [],
		},
	})

	function fetchAndUpdateInventories(fromLocation: string) {
		startTransition(async () => {
			const res = await getLocationInventories({ locationID: fromLocation })
			if (res && res.data) {
				setInventories(res.data)
			}
		})
	}

	function onSubmit(values: z.infer<typeof moveBetweenLocationsSchema>) {
		setIsSubmitting(true)
		startTransition(async () => {
			const res = await moveInventoriesBetweenLocations(values)

			if (!res) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: t('toast-error'),
				})
				setIsSubmitting(false)
				return
			}

			if (res.serverError || res.validationErrors) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: t('toast-error'),
				})
				setIsSubmitting(false)
				return
			}

			if (!res.data) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: t('toast-error'),
				})
				setIsSubmitting(false)
				return
			}

			if (!res.data.ok) {
				toast.error(t(`common:${siteConfig.errorTitle}`), {
					description: t('toast-error'),
				})
				setServerErrors(res.data.errors)
				setIsSubmitting(false)
				return
			}

			toast.error(t(`common:${siteConfig.successTitle}`), {
				description: t('toast-success'),
			})
			form.reset({
				fromLocation: initialFromLocation,
				fields: [],
			})
			setIsSubmitting(false)
		})
	}

	return (
		<div className='space-y-4'>
			<LocationAndReference
				fetchAndUpdateInventories={fetchAndUpdateInventories}
				locations={locations}
				form={form}
			/>
			<LocationFields
				form={form}
				errors={serverErrors}
				locations={locations}
				inventories={inventories}
				usePlacements={customerSettings.usePlacement}
				useBatches={useBatch}
			/>

			<Button
				disabled={!form.formState.isValid || isSubmitting}
				onClick={() => onSubmit(form.getValues())}
				className='flex items-center gap-2'>
				{isSubmitting && <Icons.spinner className='size-4 animate-spin' />}
				{t('confirm-button')}
			</Button>

			{serverErrors.length > 0 && (
				<div className='border relative rounded-md grid gap-2 px-3 py-2 bg-card shadow-sm'>
					<Button
						className='absolute top-1 right-2 hover:bg-card'
						size='icon'
						variant='ghost'
						onClick={() => setServerErrors([])}>
						<Icons.cross className='size-4' />
					</Button>
					<span className='text-sm text-destructive font-medium'>
						{t('errors-title')}
					</span>
					<div className='flex flex-col gap-1'>
						{serverErrors.map((err, i) => (
							<div key={`${err.type}-${i}`} className='text-sm'>
								<span className='font-medium'>
									{t('errors-product', { num: err.index + 1 })}
								</span>
								<span className='text-muted-foreground'>{err.message}</span>
							</div>
						))}
					</div>
				</div>
			)}
		</div>
	)
}
