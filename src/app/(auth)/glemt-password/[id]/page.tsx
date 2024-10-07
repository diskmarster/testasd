import { ResetPasswordCard } from '@/components/auth/reset-password'
import { buttonVariants } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { passwordResetService } from '@/service/password-reset'
import Link from 'next/link'

export default async function Page({ params }: { params: { id: string } }) {
	const link = await passwordResetService.getLinkById(params.id)
	console.log(link)
	if (!link || link.isExpired()) {
		return (
			<div className='mx-auto max-w-lg space-y-4 text-center'>
				<Icons.alert className='mx-auto h-12 w-12 animate-pulse text-destructive' />
				<h1 className='text-2xl font-bold tracking-tight text-foreground'>
					Der gik noget galt!
				</h1>
				<div className='flex flex-col'>
					<p className='text-md text-foreground'>
						Dette link er muligvis udløbet.
					</p>
					<p className='text-md text-foreground'>
						Gå tilbage til log ind siden og prøv igen.
					</p>
				</div>
				<Link
					className={cn(buttonVariants({ variant: 'default' }))}
					href='/log-ind'>
					Gå til log ind siden
				</Link>
			</div>
		)
	}

	return (
		<section className='w-full'>
			<ResetPasswordCard link={{id: link.id, userId: link.userId, expiresAt: link.expiresAt}} />
		</section>
	)
}
