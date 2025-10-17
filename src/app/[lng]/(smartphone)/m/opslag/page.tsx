import { serverTranslation } from '@/app/i18n'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { SmartphoneLookup } from '@/components/smartphone/smartphone-lookup'
import { SmartphoneWrapper } from '@/components/smartphone/smartphone-wrapper'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'

interface Props extends WithAuthProps {
	params: {
		lng: string
	}
}

async function SmartphoneLookupPage({
	user,
	customer,
	currentLocationID,
	params,
}: Props) {
	const settings = await customerService.getSettings(user.customerID)
	const inventories = await inventoryService.getInventory(
		user.customerID,
		currentLocationID,
	)
	const { t } = await serverTranslation(params.lng, 'smartphone')

	return (
		<SmartphoneWrapper
			title={t('lookup.title')}
			description={t('lookup.description')}
			showBackButton>
			<SmartphoneLookup
				customer={customer}
				settings={settings}
				inventories={inventories}
			/>
		</SmartphoneWrapper>
	)
}

export default withAuth(SmartphoneLookupPage, undefined, 'bruger')
