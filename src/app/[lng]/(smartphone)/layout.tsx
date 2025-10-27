import FlashMessage from '@/components/common/flash-message'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { isMaintenanceMode } from '@/lib/utils.server'
import { announcementService } from '@/service/announcements'
import { Viewport } from 'next'
import { redirect } from 'next/navigation'

export const viewport: Viewport = {
	userScalable: false,
	width: 'device-width',
	height: 'device-height',
	initialScale: 1,
	maximumScale: 1,
}

interface Props extends WithAuthProps {
	children: React.ReactNode
	params: {
		lng: string
	}
}

async function LayoutSite({ children, params: { lng } }: Readonly<Props>) {
	if (isMaintenanceMode()) {
		return redirect(`/${lng}/maintenance`)
	}

	const announcement = await announcementService.getActive()
	const hiddenAnnouncement = announcementService.getCookie()
	const isHidden = announcement?.id == hiddenAnnouncement

	return (
		<div className='relative flex min-h-dvh flex-col'>
			{announcement && !isHidden && (
				<FlashMessage announcement={announcement} />
			)}
			<main className='flex-1 flex flex-col'>{children}</main>
		</div>
	)
}

export default withAuth(LayoutSite)
