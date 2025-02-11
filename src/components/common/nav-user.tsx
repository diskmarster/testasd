'use client'

import { signOutAction } from '@/app/[lng]/(auth)/log-ud/actions'
import { useTranslation } from '@/app/i18n/client'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useLanguage } from '@/context/language'
import { User } from 'lucia'
import Link from 'next/link'

export function NavUser({ user }: { user: User }) {
  const lng = useLanguage()
  const { t } = useTranslation(lng, 'common')

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' className='relative size-9 rounded-md'>
          <Avatar className='size-9 border'>
            <AvatarImage src={undefined} alt={`${user.name} avatar`} />
            <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col gap-1'>
            <p className='h-4 overflow-x-hidden text-ellipsis text-sm font-semibold leading-none'>
              {user.name}
            </p>
            <p className='h-4 overflow-x-hidden text-ellipsis text-sm leading-none text-muted-foreground'>
              {user.email}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <Link href={`/${lng}/profil`}>{t('nav-user.my-profile')}</Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href='https://skancode.dk/kontakt/' target='_blank'>
              {t('nav-user.get-help')}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem className='focus:text-destructive' asChild>
          <form action={() => signOutAction()}>
            <button className='w-full text-left' type='submit'>
              {t('nav-user.log-out')}
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
