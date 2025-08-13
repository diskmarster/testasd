import { Header } from '@/components/common/header'
import { isMaintenanceMode } from '@/lib/utils.server'
import { announcementService } from '@/service/announcements'
import { redirect } from 'next/navigation'
import FlashMessage from './flash-message'
import { withAuth, WithAuthProps } from './with-auth'

interface Props extends WithAuthProps {
	children: React.ReactNode
	params: {
		lng: string
	}
}

async function LayoutSite({
	children,
	params: { lng },
	user,
	customer,
}: Readonly<Props>) {
	if (isMaintenanceMode()) {
		return redirect(`/${lng}/maintenance`)
	}

	const announcement = await announcementService.getActive()
	const hiddenAnnouncement = announcementService.getCookie()
	const isHidden = announcement?.id == hiddenAnnouncement

	return (
		<div className='relative flex min-h-screen flex-col'>
			{announcement && !isHidden && (
				<FlashMessage announcement={announcement} />
			)}
			<Header lng={lng} user={user} customer={customer} />
			<main className='flex-1'>{children}</main>
		</div>
	)
}

export default withAuth(LayoutSite)
