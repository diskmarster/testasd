import { serverTranslation } from '@/app/i18n'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { SmartphoneUpdateInventory } from '@/components/smartphone/smartphone-update-inventory'
import { SmartphoneWrapper } from '@/components/smartphone/smartphone-wrapper'
import { customerService } from '@/service/customer'
import { inventoryService } from '@/service/inventory'

interface Props extends WithAuthProps {
	params: {
		lng: string
	}
}

async function SmartphoneRegulatePage({
	user,
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
			title={t('updateInventory.title')}
			description={t('updateInventory.description')}
			showBackButton>
			<SmartphoneUpdateInventory
				updateType='regulering'
				settings={settings}
				inventories={inventories}
			/>
		</SmartphoneWrapper>
	)
}

export default withAuth(SmartphoneRegulatePage, undefined, 'bruger')
