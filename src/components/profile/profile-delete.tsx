'use client'

import { deleteProfileAction } from '@/app/(site)/profil/actions'
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
import { useSession } from '@/context/session'
import { UserNoHash } from '@/lib/database/schema/auth'
import { useTransition } from 'react'
import { toast } from 'sonner'

export function ProfileDelete({ user }: { user?: UserNoHash }) {
  return (
    <div className='flex flex-row items-center justify-between rounded-md border p-4 md:max-w-lg'>
      <div className='grid gap-0.5'>
        <Label>Slet bruger</Label>
        <p className='text-sm text-muted-foreground'>
          Slet bruger fra platformen
        </p>
      </div>
      <DeleteDialog user={user} />
    </div>
  )
}

function DeleteDialog({ user: profileUser }: { user?: UserNoHash }) {
  const { session, user } = useSession()
  const [pending, startTransition] = useTransition()
  if (!session) return null
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant='outline' className='hover:text-destructive'>
          Slet bruger
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Slet bruger</AlertDialogTitle>
          <AlertDialogDescription>
            Denne handling er permanent og kan ikke fortrydes når først det er
            fuldført.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Luk</AlertDialogCancel>
          <AlertDialogAction
            className='flex items-center gap-2'
            onClick={() => {
              startTransition(async () => {
                const res = await deleteProfileAction({ userId: profileUser ? profileUser.id : user.id })
                if (res && res.serverError)
                  toast.error(siteConfig.errorTitle, {
                    description: res.serverError,
                  })
              })
            }}>
            {pending && <Icons.spinner className='size-4 animate-spin' />}
            Slet
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
