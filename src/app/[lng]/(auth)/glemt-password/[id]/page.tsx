import { ResetPasswordCard } from '@/components/auth/reset-password'
import { ResetPinCard } from '@/components/auth/reset-pin'
import { passwordResetService } from '@/service/password-reset'

interface PageProps {
  params: {
    id: string
    lng: string
  }
  searchParams: {
    type: string
  }
}

export default async function Page({ params, searchParams }: PageProps) {
  const link = await passwordResetService.getLinkById(params.id)

  return (
    <section className='w-full'>
      {link != undefined ? (
        link.passwordType == 'pw' ? (
          <ResetPasswordCard
            link={{
              id: link.id,
              userId: link.userId,
              expiresAt: link.expiresAt,
              passwordType: link.passwordType,
            }}
          />
        ) : (
          <ResetPinCard
            link={{
              id: link.id,
              userId: link.userId,
              expiresAt: link.expiresAt,
              passwordType: link.passwordType,
            }}
          />
        )
      ) : searchParams.type == 'pw' ? (
        <ResetPasswordCard />
      ) : searchParams.type == 'pin' ? (
        <ResetPinCard />
      ) : null}
    </section>
  )
}
