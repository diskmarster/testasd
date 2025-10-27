import { serverTranslation } from '@/app/i18n'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { SmartphoneLogoutButton } from '@/components/smartphone/smarthpone-logout-button'
import { SmartphoneLocationSwitcher } from '@/components/smartphone/smartphone-location-switcher'
import { SmartphoneWrapper } from '@/components/smartphone/smartphone-wrapper'
import { Icons } from '@/components/ui/icons'
import { locationService } from '@/service/location'
import { LucideIcon } from 'lucide-react'
import Link from 'next/link'

interface Props extends WithAuthProps {
	params: { lng: string }
}

async function SmartphoneLanding({ user, currentLocationID, params }: Props) {
	const location = await locationService.getByID(currentLocationID)
	const locations = await locationService.getAllByUserID(user.id)
	const isOutgoingUser = user.role === 'afgang'
	const { t } = await serverTranslation(params.lng, 'smartphone')
	return (
		<SmartphoneWrapper
			title={t('homeTitle')}
			description={t('homeDescription')}>
			<>
				{location && locations.length > 1 && (
					<SmartphoneLocationSwitcher
						location={location}
						locations={locations}
					/>
				)}
				<SmartphoneCardLink
					title={t('updateInventory.title', { context: 'tilgang' })}
					href='/m/tilgang'
					icon={Icons.packagePlus}
					hide={isOutgoingUser}
				/>
				<SmartphoneCardLink
					title={t('updateInventory.title', { context: 'afgang' })}
					href='/m/afgang'
					icon={Icons.packageMinus}
				/>
				<SmartphoneCardLink
					title={t('updateInventory.title', { context: 'regulering' })}
					href='/m/regulering'
					// @ts-ignore - plusMinus does not match type LucideIcon
					icon={Icons.plusMinus}
					hide={isOutgoingUser}
				/>
				<SmartphoneCardLink
					title={t('lookup.title')}
					href='/m/opslag'
					icon={Icons.search}
					hide={isOutgoingUser}
				/>
			</>
			<SmartphoneLogoutButton />
		</SmartphoneWrapper>
	)
}

export default withAuth(SmartphoneLanding, undefined, 'afgang')

function SmartphoneCardLink({
	title,
	href,
	icon: Icon,
	hide = false,
}: {
	title: string
	href: string
	icon: LucideIcon
	hide?: boolean
}) {
	if (hide) return null
	return (
		<Link className='border rounded-lg shadow-md flex' href={href}>
			<div className='grid place-items-center bg-accent w-16 aspect-square border-r rounded-lg rounded-r-none'>
				<Icon className='size-6 text-primary' />
			</div>
			<p className='self-center w-full px-3'>{title}</p>
		</Link>
	)
}
