'use client'

import { deleteProfileAction } from '@/app/[lng]/(site)/profil/actions'
import { useTranslation } from '@/app/i18n/client'
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { Label } from '@/components/ui/label'
import { siteConfig } from '@/config/site'
import { useLanguage } from '@/context/language'
import { useSession } from '@/context/session'
import { UserNoHash } from '@/lib/database/schema/auth'
import { useTransition } from 'react'
import { toast } from 'sonner'

export function ProfileDelete({ user }: { user?: UserNoHash }) {
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'profil')
	return (
		<div className='flex flex-row items-center justify-between rounded-md border p-4 md:max-w-lg'>
			<div className='grid gap-0.5'>
				<Label>{t('profile-delete.delete-user')}</Label>
				<p className='text-sm text-muted-foreground'>
					{t('profile-delete.delete-description')}
				</p>
			</div>
			<DeleteDialog user={user} />
		</div>
	)
}

function DeleteDialog({ user: profileUser }: { user?: UserNoHash }) {
	const { session, user } = useSession()
	const [pending, startTransition] = useTransition()
	const lng = useLanguage()
	const { t } = useTranslation(lng, 'profil')
	if (!session) return null
	return (
		<AlertDialog>
			<AlertDialogTrigger asChild>
				<Button variant='outline' className='hover:text-destructive'>
					{t('profile-delete.delete-user')}
				</Button>
			</AlertDialogTrigger>
			<AlertDialogContent>
				<AlertDialogHeader>
					<AlertDialogTitle>{t('profile-delete.delete-user')}</AlertDialogTitle>
					<AlertDialogDescription>
						{t('profile-delete-dialog.delete-user-alert')}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel>
						{t('profile-delete-dialog.cancel-button')}
					</AlertDialogCancel>
					<AlertDialogAction
						className='flex items-center gap-2'
						onClick={() => {
							startTransition(async () => {
								const res = await deleteProfileAction({
									userId: profileUser ? profileUser.id : user.id,
								})
								if (res && res.serverError)
									toast.error(t(`common:${siteConfig.errorTitle}`), {
										description: res.serverError,
									})
							})
						}}>
						{pending && <Icons.spinner className='size-4 animate-spin' />}
						{t('profile-delete-dialog.delete-button')}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
