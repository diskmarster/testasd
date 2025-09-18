import { MailSettings } from '@/components/admin/mail-settings'
import { Customer } from '@/lib/database/schema/customer'
import { customerService } from '@/service/customer'
import { User } from 'lucia'

interface Props {
	customer: Customer
	user: User
}

export async function MailSettingWrapper({ customer, user }: Props) {
	const userID = user.role == 'moderator' ? user.id : undefined
	const settings = await customerService.getMailSettings(customer.id, userID)
	return (
		<div>
			<MailSettings settings={settings} user={user} />
		</div>
	)
}
