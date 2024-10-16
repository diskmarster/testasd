import { serverTranslation } from '@/app/i18n'
import { ResetPasswordCard } from '@/components/auth/reset-password'
import { buttonVariants } from '@/components/ui/button'
import { Icons } from '@/components/ui/icons'
import { cn } from '@/lib/utils'
import { passwordResetService } from '@/service/password-reset'
import Link from 'next/link'

interface PageProps {
	params: {
	  lng: string
	}
}

export default async function Page({
  params,
}: {
  params: { id: string; lng: string }
}) {
  const link = await passwordResetService.getLinkById(params.id)
  const { t } = await serverTranslation(params.lng, 'log-ind')
  if (!link || link.isExpired()) {
    return (
      <div className='mx-auto max-w-lg space-y-4 text-center'>
        <Icons.alert className='mx-auto h-12 w-12 animate-pulse text-destructive' />
        <h1 className='text-2xl font-bold tracking-tight text-foreground'>
          {t('reset-password-page.something-went-wrong')}
        </h1>
        <div className='flex flex-col'>
          <p className='text-md text-foreground'>
            {t('reset-password-page.this-link-is-invalid')}
          </p>
          <p className='text-md text-foreground'>
            {t('reset-password-page.back-to-login')}
          </p>
        </div>
        <Link
          className={cn(buttonVariants({ variant: 'default' }))}
          href={`/${params.lng}/log-ind`}>
          {t('reset-password-page.back-to-login')}
        </Link>
      </div>
    )
  }

  return (
    <section className='w-full'>
      <ResetPasswordCard
        link={{ id: link.id, userId: link.userId, expiresAt: link.expiresAt }}
      />
    </section>
  )
}
