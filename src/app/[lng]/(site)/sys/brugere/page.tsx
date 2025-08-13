import { serverTranslation } from '@/app/i18n'
import { ModalEditUser } from '@/components/admin/modal-edit-user'
import { ModalResetUserPin } from '@/components/admin/modal-reset-user-pin'
import { ModalResetUserPW } from '@/components/admin/modal-reset-user-pw'
import { ModalToggleUser } from '@/components/admin/modal-toggle-user'
import { SiteWrapper } from '@/components/common/site-wrapper'
import { SkeletonTable } from '@/components/common/skeleton-table'
import { withAuth, WithAuthProps } from '@/components/common/with-auth'
import { ModalDeleteUser } from '@/components/sys/modal-delete-user'
import { ModalInviteCreateUser } from '@/components/sys/modal-invite-create-user'
import { ModalResendLink } from '@/components/sys/modal-resend-link'
import { ModalDeleteLink } from '@/components/sys/model-delete-link'
import { Suspense } from 'react'
import { UsersTable } from './table'

interface Props extends WithAuthProps {
	params: { lng: string }
}

async function Page({ params: { lng } }: Props) {
	const { t } = await serverTranslation(lng, 'sys-bruger')

	return (
		<SiteWrapper
			title={t('page.title')}
			description={t('page.description')}
			actions={
				<>
					<ModalInviteCreateUser />
				</>
			}>
			<Suspense fallback={<SkeletonTable />}>
				<UsersTable />
			</Suspense>

			<ModalEditUser />
			<ModalToggleUser />
			<ModalResetUserPW />
			<ModalResetUserPin />
			<ModalDeleteUser />
			<ModalDeleteLink />
			<ModalResendLink />
		</SiteWrapper>
	)
}

export default withAuth(Page, undefined, 'system_administrator')
